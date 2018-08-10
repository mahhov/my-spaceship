(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.


 Copyright (c) 2018 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
(function() {
  'use strict';

  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

  function SimplexNoise(randomOrSeed) {
    var random;
    if (typeof randomOrSeed == 'function') {
      random = randomOrSeed;
    }
    else if (randomOrSeed) {
      random = alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.p = buildPermutationTable(random);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }

  }
  SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
      -1, 1, 0,
      1, -1, 0,

      -1, -1, 0,
      1, 0, 1,
      -1, 0, 1,

      1, 0, -1,
      -1, 0, -1,
      0, 1, 1,

      0, -1, 1,
      0, 1, -1,
      0, -1, -1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
      0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
      1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
      -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
      1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
      -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
      1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
      -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]),
    noise2D: function(xin, yin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0 = 0; // Noise contributions from the three corners
      var n1 = 0;
      var n2 = 0;
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin) * F2; // Hairy factor for 2D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t; // Unskew the cell origin back to (x,y) space
      var Y0 = j - t;
      var x0 = xin - X0; // The x,y distances from the cell origin
      var y0 = yin - Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0;
        j1 = 1;
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        var gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function(xin, yin, zin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var k = Math.floor(zin + s);
      var t = (i + j + k) * G3;
      var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j - t;
      var Z0 = k - t;
      var x0 = xin - X0; // The x,y,z distances from the cell origin
      var y0 = yin - Y0;
      var z0 = zin - Z0;
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // X Z Y order
        else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // Z X Y order
      }
      else { // x0<y0
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Y Z X order
        else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // Y X Z order
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0 * G3;
      var z2 = z0 - k2 + 2.0 * G3;
      var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0 * G3;
      var z3 = z0 - 1.0 + 3.0 * G3;
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function(x, y, z, w) {
      var perm = this.perm;
      var grad4 = this.grad4;

      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = Math.floor(x + s);
      var j = Math.floor(y + s);
      var k = Math.floor(z + s);
      var l = Math.floor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // Six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to rank the numbers.
      var rankx = 0;
      var ranky = 0;
      var rankz = 0;
      var rankw = 0;
      if (x0 > y0) rankx++;
      else ranky++;
      if (x0 > z0) rankx++;
      else rankz++;
      if (x0 > w0) rankx++;
      else rankw++;
      if (y0 > z0) ranky++;
      else rankz++;
      if (y0 > w0) ranky++;
      else rankw++;
      if (z0 > w0) rankz++;
      else rankw++;
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      // Rank 3 denotes the largest coordinate.
      i1 = rankx >= 3 ? 1 : 0;
      j1 = ranky >= 3 ? 1 : 0;
      k1 = rankz >= 3 ? 1 : 0;
      l1 = rankw >= 3 ? 1 : 0;
      // Rank 2 denotes the second largest coordinate.
      i2 = rankx >= 2 ? 1 : 0;
      j2 = ranky >= 2 ? 1 : 0;
      k2 = rankz >= 2 ? 1 : 0;
      l2 = rankw >= 2 ? 1 : 0;
      // Rank 1 denotes the second smallest coordinate.
      i3 = rankx >= 1 ? 1 : 0;
      j3 = ranky >= 1 ? 1 : 0;
      k3 = rankz >= 1 ? 1 : 0;
      l3 = rankw >= 1 ? 1 : 0;
      // The fifth corner has all coordinate offsets = 1, so no need to compute that.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0 * G4;
      var z2 = z0 - k2 + 2.0 * G4;
      var w2 = w0 - l2 + 2.0 * G4;
      var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0 * G4;
      var z3 = z0 - k3 + 3.0 * G4;
      var w3 = w0 - l3 + 3.0 * G4;
      var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0 * G4;
      var z4 = z0 - 1.0 + 4.0 * G4;
      var w4 = w0 - 1.0 + 4.0 * G4;
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
        t1 *= t1;
        n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
        t2 *= t2;
        n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
        t3 *= t3;
        n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
      }
      var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
      if (t4 < 0) n4 = 0.0;
      else {
        var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
        t4 *= t4;
        n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
  };

  function buildPermutationTable(random) {
    var i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (i = 0; i < 255; i++) {
      var r = i + ~~(random() * (256 - i));
      var aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    return p;
  }
  SimplexNoise._buildPermutationTable = buildPermutationTable;

  function alea() {
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
  }
  function masher() {
    var n = 0xefc8249d;
    return function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }

  // amd
  if (typeof define !== 'undefined' && define.amd) define(function() {return SimplexNoise;});
  // common js
  if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
  // browser
  else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
  // nodejs
  if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
  }

})();

},{}],2:[function(require,module,exports){
const Pool = require('../util/Pool');
const {UiCs, UiPs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');

class Ability {
	constructor(cooldown, charges, stamina, repeatable, uiIndex, paintUiColor) {
		this.cooldown = new Pool(cooldown, -1);
		this.charges = new Pool(charges, 1);
		this.stamina = stamina;
		this.repeatable = repeatable;
		this.uiIndex = uiIndex;
		this.paintUiColor = paintUiColor;
	}

	safeActivate(origin, direct, map, intersectionFinder, player) {
		if (this.ready)
			if (this.activate(origin, direct, map, intersectionFinder, player)) {
				this.charges.change(-1);
				player.consumeStamina(this.stamina);
			}
		this.repeating = 2;
	}

	activate(origin, direct, map, intersectionFinder, player) {
	}

	refresh(player) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}
		this.repeating && this.repeating--;
		this.ready = !this.charges.isEmpty() && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating)
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = UiPs.ABILITY_SIZE + UiPs.MARGIN;
		const LEFT = UiPs.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, {fill: true, color: this.paintUiColor.getShade()}));

		// foreground for current charges
		const ROW_HEIGHT = UiPs.ABILITY_SIZE / this.charges.getMax();
		const HEIGHT = this.charges.get() * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT, UiPs.ABILITY_SIZE, HEIGHT, {fill: true, color: this.paintUiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(LEFT, TOP + UiPs.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, UiPs.ABILITY_SIZE, ROW_HEIGHT, {fill: true, color: this.paintUiColor.getShade(shade)}));
		}

		if (!this.ready)
			painter.add(new Rect(LEFT, TOP, UiPs.ABILITY_SIZE, UiPs.ABILITY_SIZE, {color: UiCs.NOT_READY.get(), thickness: 4}));
	}
}

module.exports = Ability;

},{"../painter/Rect":58,"../util/Pool":72,"../util/UiConstants":74}],3:[function(require,module,exports){
const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 3, 10, false, paintUiColumn, UiCs.DASH);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;
		player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		return true;
	}
}

module.exports = Dash;

},{"../util/Number":70,"../util/UiConstants":74,"./Ability":2}],4:[function(require,module,exports){
const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(720, 1, 30, false, paintUiColumn, UiCs.HEAL);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.health.isFull())
			return false;
		player.changeHealth(.1);
		return true;
	}
}

module.exports = Dash;

},{"../util/Number":70,"../util/UiConstants":74,"./Ability":2}],5:[function(require,module,exports){
const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude, randVector} = require('../util/Number');
const Laser = require('../entities/attack/Laser');

class LaserAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const RANGE = .15, SPREAD = .05, TIME = 10, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, RANGE);
		let randv = randVector(RANGE * SPREAD);
		let laser = new Laser(origin.x, origin.y, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, true);
		map.addProjectile(laser);
		return true;
	}
}

module.exports = LaserAttack;

},{"../entities/attack/Laser":15,"../util/Number":70,"../util/UiConstants":74,"./Ability":2}],6:[function(require,module,exports){
const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .015, SPREAD = .1, SIZE = .01, TIME = 100, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, true);
		map.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;

},{"../entities/attack/Projectile":16,"../util/Number":70,"../util/UiConstants":74,"./Ability":2}],7:[function(require,module,exports){
const {clamp, avg} = require('../util/Number');
const Keymapping = require('../control/Keymapping');

class Camera {
	constructor(x, y, z = 3) {
		this.x = x;
		this.y = y;
		this.endZ = this.z = z;
		this.s0 = this.calcS(0);
	}

	static createForRegion(fromScale, toLeft, toTop, toScale) {
		let invScale = fromScale / toScale;
		return new Camera((.5 - toLeft) * invScale, (.5 - toTop) * invScale, invScale);
	}

	// center range [[0, width], [0, height]]
	// adjustment range [[0, 1], [0, 1]]
	move(center, adjustment) {
		const ADJUSTMENT_WEIGHT = .5, FILTER_WEIGHT = .93;
		let x = center.x + (adjustment.x - .5) * ADJUSTMENT_WEIGHT;
		let y = center.y + (adjustment.y - .5) * ADJUSTMENT_WEIGHT;
		this.x = avg(this.x, x, FILTER_WEIGHT);
		this.y = avg(this.y, y, FILTER_WEIGHT);
	}

	zoom(controller, keymapping) {
		const ZOOM_RATE = .2, MIN_Z = 1, MAX_Z = 10, FILTER_WEIGHT = .93;
		let dz = keymapping.getKeyState(controller, Keymapping.Keys.ZOOM_OUT).active - keymapping.getKeyState(controller, Keymapping.Keys.ZOOM_IN).active;
		if (dz)
			this.endZ = clamp(this.endZ + dz * ZOOM_RATE, MIN_Z, MAX_Z);
		this.z = avg(this.z, this.endZ, FILTER_WEIGHT);
		this.s0 = this.calcS(0);
	}

	calcS(dz) {
		return 1 / (this.z + dz);
	}

	getS(dz) {
		return dz ? this.calcS(dz) : this.s0;
	}

	xt(x, dz = 0) {
		return (x - this.x) * this.getS(dz) + .5;
	}

	yt(y, dz = 0) {
		return (y - this.y) * this.getS(dz) + .5;
	}

	st(size, dz = 0) {
		return size * this.getS(dz);
	}

	xit(x) {
		return this.x + (x - .5) * this.z;
	}

	yit(y) {
		return this.y + (y - .5) * this.z;
	}
}

module.exports = Camera;

},{"../control/Keymapping":9,"../util/Number":70}],8:[function(require,module,exports){
const State = require('./State');

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: null, y: null};
		this.transformedMouse = {};
		this.mouseState = new State();

		document.addEventListener('keydown', event =>
			!event.repeat && this.handleKeyPress(event.key.toLowerCase()));

		document.addEventListener('keyup', event =>
			this.handleKeyRelease(event.key.toLowerCase()));

		document.addEventListener('mousemove', event =>
			this.handleMouseMove(event.x - mouseTarget.offsetLeft, event.y - mouseTarget.offsetTop));

		document.addEventListener('mousedown', () =>
			this.handleMousePress());

		document.addEventListener('mouseup', () =>
			this.handleMouseRelease());

		window.addEventListener('blur', () =>
			this.handleBlur());
	}

	handleKeyPress(key) {
		if (!this.keys[key])
			this.keys[key] = new State();
		this.keys[key].press();
	}

	handleKeyRelease(key) {
		if (!this.keys[key])
			this.keys[key] = new State();
		this.keys[key].release();
	}

	handleMouseMove(x, y) {
		this.mouse.x = x / this.mouseTargetWidth;
		this.mouse.y = y / this.mouseTargetHeight;
	}

	handleMousePress() {
		this.mouseState.press();
	}

	handleMouseRelease() {
		this.mouseState.release();
	}

	handleBlur() {
		Object.values(this.keys)
			.filter((state) => state.active)
			.forEach((state) => state.release());
	}

	// map key (e.g. 'z') to state
	getKeyState(key) {
		return this.keys[key] || (this.keys[key] = new State());
	}

	getRawMouse(defaultX = 0, defaultY = 0) {
		return this.mouse.x ? this.mouse : {x: defaultX, y: defaultY};
	}

	inverseTransformMouse(inverseTransformer) {
		this.transformedMouse.x = inverseTransformer.xit(this.mouse.x);
		this.transformedMouse.y = inverseTransformer.yit(this.mouse.y);
	}

	getMouse() {
		return this.transformedMouse;
	}

	getMouseState() {
		return this.mouseState;
	}

	expire() {
		Object.values(this.keys).forEach((state) => state.expire());
		this.mouseState.expire();
	}
}

module.exports = Controller;

},{"./State":10}],9:[function(require,module,exports){
const makeEnum = require('../util/Enum');
const Controller = require('./Controller');

const Keys = makeEnum(
	'MOVE_LEFT',
	'MOVE_UP',
	'MOVE_RIGHT',
	'MOVE_DOWN',
	'ABILITY_1',
	'ABILITY_2',
	'ABILITY_3',
	'ABILITY_4',
	'ABILITY_5',
	'ABILITY_6',
	'ABILITY_7',
	'TARGET_LOCK',
	'ZOOM_IN',
	'ZOOM_OUT',
	'MINIMAP_ZOOM');

Keys.ABILITY_I = [
	Keys.ABILITY_1,
	Keys.ABILITY_2,
	Keys.ABILITY_3,
	Keys.ABILITY_4,
	Keys.ABILITY_5,
	Keys.ABILITY_6,
	Keys.ABILITY_7];

class Keymapping {
	constructor() {
		this.map = {};

		this.map[Keys.MOVE_LEFT] = 'a';
		this.map[Keys.MOVE_UP] = 'w';
		this.map[Keys.MOVE_RIGHT] = 'd';
		this.map[Keys.MOVE_DOWN] = 's';
		this.map[Keys.ABILITY_1] = 'j';
		this.map[Keys.ABILITY_2] = 'k';
		this.map[Keys.ABILITY_3] = 'l';
		this.map[Keys.ABILITY_4] = 'u';
		this.map[Keys.ABILITY_5] = 'i';
		this.map[Keys.ABILITY_6] = 'o';
		this.map[Keys.ABILITY_7] = 'p';
		this.map[Keys.TARGET_LOCK] = 'capslock';
		this.map[Keys.ZOOM_IN] = 'x';
		this.map[Keys.ZOOM_OUT] = 'z';
		this.map[Keys.MINIMAP_ZOOM] = 'q';
	}

	// map control (e.g. ZOOM_OUT) to key (e.g. 'z')
	getKey(control) {
		return this.map[control];
	}

	// map control (e.g. ZOOM_OUT) to state
	getKeyState(controller, control) {
		return controller.getKeyState(this.getKey(control));
	}
}

Keymapping.Keys = Keys;

module.exports = Keymapping;

},{"../util/Enum":66,"./Controller":8}],10:[function(require,module,exports){
const makeEnum = require('../util/Enum');

const States = makeEnum('UP', 'DOWN', 'PRESSED', 'RELEASED');

class State {
	constructor() {
		this.set(State.UP);
	}

	set(state) {
		this.state = state;
	}

	press() {
		this.state = States.PRESSED;
	}

	release() {
		this.state = States.RELEASED;
	}

	expire() {
		if (this.state === States.RELEASED)
			this.state = States.UP;
		else if (this.state === States.PRESSED)
			this.state = States.DOWN;
	}

	get active() {
		return this.state === States.PRESSED || this.state === States.DOWN;
	}

	get pressed() {
		return this.state === States.PRESSED;
	}
}

State.States = States;

module.exports = State;

},{"../util/Enum":66}],11:[function(require,module,exports){
const Bounds = require('../intersection/Bounds');
const {setMagnitude} = require('../util/Number');

class Entity {
	constructor(x, y, width, height, layer) {
		this.bounds = new Bounds();
		this.width = width;
		this.height = height;
		this.layer = layer;
		this.setPosition(x, y);
		this.moveDirection = {x: 0, y: 1};
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
		this.setBounds();
	}

	checkMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		return intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
	}

	safeMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		let moveXY = intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
		this.move(...moveXY);
		return moveXY[2];
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		if (dx || dy)
			this.moveDirection = setMagnitude(dx, dy);
		this.setBounds();
	}

	addIntersectionBounds(intersectionFinder) {
		this.intersectionHandle = intersectionFinder.addBounds(this.layer, this.bounds, this);
	}

	removeIntersectionBounds(intersectionFinder) {
		intersectionFinder.removeBounds(this.layer, this.intersectionHandle);
	}

	setBounds() {
		let halfWidth = this.width / 2;
		let halfHeight = this.height / 2;
		this.bounds.set(this.x - halfWidth, this.y - halfHeight, this.x + halfWidth, this.y + halfHeight);
	}

	changeHealth(amount) {
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}

	paintUi(painter, camera) {
	}
}

module.exports = Entity;

},{"../intersection/Bounds":40,"../util/Number":70}],12:[function(require,module,exports){
const Entity = require('./Entity');
const Pool = require('../util/Pool');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
	}

	changeHealth(amount) {
		this.health.change(amount);
	}

	restoreHealth() {
		this.health.restore();
	}
}

module.exports = LivingEntity;

},{"../util/Pool":72,"./Entity":11}],13:[function(require,module,exports){
const LivingEntity = require('./LivingEntity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {UiCs, UiPs} = require('../util/UiConstants');
const VShip = require('../graphics/VShip');
const Pool = require('../util/Pool');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const LaserAttack = require('../abilities/LaserAttack');
const Dash = require('../abilities/Dash');
const Heal = require('../abilities/Heal');
const Decay = require('../util/Decay');
const Keymapping = require('../control/Keymapping');
const Bounds = require('../intersection/Bounds');
const {setMagnitude, booleanArray, rand, randVector} = require('../util/Number');
const Dust = require('./particle/Dust');
const RectC = require('../painter/RectC');
const Bar = require('../painter/Bar');
const Rect = require('../painter/Rect');

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends LivingEntity {
	constructor() {
		super(0, 0, .05, .05, 1, IntersectionFinder.Layers.FRIENDLY_UNIT);
		this.setGraphics(new VShip(this.width, this.height, {fill: true, color: UiCs.Entity.PLAYER.get()}));

		this.stamina = new Pool(100, .13);
		this.abilities = [new ProjectileAttack(0), new Dash(1), new Heal(2)];

		this.recentDamage = new Decay(.1, .001);
	}

	update(map, controller, keymapping, intersectionFinder) {
		this.refresh();
		this.moveControl(controller, keymapping, intersectionFinder);
		this.abilityControl(map, controller, keymapping, intersectionFinder);
		this.targetLockControl(controller, keymapping, intersectionFinder);
		this.createMovementParticle(map);
	}

	refresh() {
		this.stamina.increment();
	}

	moveControl(controller, keymapping, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);
		const SPEED = .005;

		let left = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_LEFT).active;
		let up = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_UP).active;
		let right = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_RIGHT).active;
		let down = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_DOWN).active;

		let dx = 0, dy = 0;

		if (left)
			dx -= 1;
		if (up)
			dy -= 1;
		if (right)
			dx += 1;
		if (down)
			dy += 1;

		if (dx && dy) {
			dx = Math.sign(dx) * invSqrt2;
			dy = Math.sign(dy) * invSqrt2;
		}

		this.currentMove = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, SPEED);
	}

	abilityControl(map, controller, keymapping, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};

		this.abilities
			.forEach((ability, index) => {
				ability.refresh(this);
				if (keymapping.getKeyState(controller, Keymapping.Keys.ABILITY_I[index]).active)
					ability.safeActivate(this, direct, map, intersectionFinder, this);
			});
	}

	targetLockControl(controller, keymapping, intersectionFinder) {
		if (this.targetLock && this.targetLock.health.isEmpty())
			this.targetLock = null;

		if (!keymapping.getKeyState(controller, Keymapping.Keys.TARGET_LOCK).pressed)
			return;

		if (this.targetLock) {
			this.targetLock = null;
			return;
		}

		let mouse = controller.getMouse();
		let targetLockBounds = new Bounds(
			mouse.x - TARGET_LOCK_BORDER_SIZE / 2,
			mouse.y - TARGET_LOCK_BORDER_SIZE / 2,
			mouse.x + TARGET_LOCK_BORDER_SIZE / 2,
			mouse.y + TARGET_LOCK_BORDER_SIZE / 2);
		this.targetLock = intersectionFinder.hasIntersection(IntersectionFinder.Layers.HOSTILE_UNIT, targetLockBounds);
	}

	createMovementParticle(map) {
		const RATE = .4, SIZE = .005, DIRECT_VELOCITY = .003, RAND_VELOCITY = .001;

		if (!booleanArray(this.currentMove) || rand() > RATE)
			return;

		let directv = setMagnitude(...this.currentMove, -DIRECT_VELOCITY);
		let randv = randVector(RAND_VELOCITY);

		map.addParticle(new Dust(this.x, this.y, SIZE, directv.x + randv[0], directv.y + randv[1], 100));
	}

	sufficientStamina(amount) {
		return amount <= this.stamina.get();
	}

	consumeStamina(amount) {
		this.stamina.change(-amount);
	}

	changeHealth(amount) {
		super.changeHealth(amount);
		this.recentDamage.add(-amount);
	}

	paintUi(painter, camera) {
		// target lock
		// todo [medium] target lock draws over monster healht bar
		if (this.targetLock)
			painter.add(RectC.withCamera(camera, this.targetLock.x, this.targetLock.y,
				this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE,
				{color: UiCs.TARGET_LOCK.get(), thickness: 3}));

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = UiPs.BAR_HEIGHT + UiPs.MARGIN;
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.stamina.getRatio(), UiCs.STAMINA.getShade(UiCs.BAR_SHADING), UiCs.STAMINA.get(), UiCs.STAMINA.getShade(UiCs.BAR_SHADING)));
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.health.getRatio(), UiCs.LIFE.getShade(UiCs.BAR_SHADING), UiCs.LIFE.get(), UiCs.LIFE.getShade(UiCs.BAR_SHADING)));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// damage overlay
		let damageColor = UiCs.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;

},{"../abilities/Dash":3,"../abilities/Heal":4,"../abilities/LaserAttack":5,"../abilities/ProjectileAttack":6,"../control/Keymapping":9,"../graphics/VShip":36,"../intersection/Bounds":40,"../intersection/IntersectionFinder":41,"../painter/Bar":52,"../painter/Rect":58,"../painter/RectC":59,"../util/Decay":65,"../util/Number":70,"../util/Pool":72,"../util/UiConstants":74,"./LivingEntity":12,"./particle/Dust":30}],14:[function(require,module,exports){
const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {UiCs} = require('../util/UiConstants');
const RockGraphics = require('../graphics/RockGraphic');

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphics(size, size, {fill: true, color: UiCs.Entity.ROCK.get()}));
	}
}

module.exports = Rock;

},{"../graphics/RockGraphic":33,"../intersection/IntersectionFinder":41,"../util/UiConstants":74,"./Entity":11}],15:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const Line = require('../../painter/Line');

class Laser extends Entity {
	constructor(x, y, dx, dy, time, damage, friendly) {
		const THICKNESS = .001;
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, THICKNESS, THICKNESS, layer);
		this.dx = dx;
		this.dy = dy;
		this.time = time;
		this.damage = damage;
	}

	update(map, intersectionFinder) {
		if (!this.moveX)
			[this.moveX, this.moveY, this.intersection] = this.checkMove(intersectionFinder, this.dx, this.dy, -1, true);

		if (this.time--)
			return;

		if (this.intersection)
			this.intersection.changeHealth(-this.damage);

		return true;
	}

	paint(painter, camera) {
		painter.add(Line.withCamera(camera, this.x, this.y, this.x + this.moveX, this.y + this.moveY));
	}
}

module.exports = Laser;

},{"../../intersection/IntersectionFinder":41,"../../painter/Line":54,"../Entity":11}],16:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {randVector} = require('../../util/Number');
const Dust = require('../particle/Dust');
const {UiCs} = require('../../util/UiConstants');
const RectC = require('../../painter/RectC');

class Projectile extends Entity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
	}

	update(map, intersectionFinder) { // todo [medium] fix naming disconnect, map refers to lasers and projectiles as projectiles. entities refer to laser and projectile as attacks. create projectile/attcak parent class to have update iterface
		const FRICTION = .95;

		let intersection = this.safeMove(intersectionFinder, this.vx, this.vy, -1, true);

		if (intersection) {
			intersection.changeHealth(-this.damage);
			map.addParticle(new Dust(this.x, this.y, .005, ...randVector(.001), 100));
			return true;
		}

		if (!this.time--)
			return true;

		this.vx *= FRICTION;
		this.vy *= FRICTION;

		// todo [low] do damage when collided with (as opposed to when colliding)
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: UiCs.Entity.PROJECTILE.get()}));
	}
}

module.exports = Projectile;

},{"../../intersection/IntersectionFinder":41,"../../painter/RectC":59,"../../util/Number":70,"../../util/UiConstants":74,"../Entity":11,"../particle/Dust":30}],17:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed) {
		this.origin = origin;
		this.speed = speed;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let {x: dx, y: dy} = setMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;

},{"../../util/Enum":66,"../../util/Number":70,"./Module":20}],18:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Distance extends ModuleManager {
	// distances should be in increasing order
	// if this.distances = [10, 20], then phase 1 = [10, 20)
	config(origin, ...distances) {
		this.origin = origin;
		this.distances = distances;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		let phase = this.distances.findIndex(distance => targetDistance < distance);
		if (phase === -1)
			phase = this.distances.length;
		this.modulesSetStage(phase);

		this.modulesApply(map, intersectionFinder, target);
	}
}

Distance.Stages = Stages;

module.exports = Distance;

},{"../../util/Enum":66,"../../util/Number":70,"./ModuleManager":21}],19:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('ENGAGED', 'DISENGAGED');

class Engage extends ModuleManager {
	config(origin, nearDistance, farDistance) {
		this.origin = origin;
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		if (targetDistance < this.nearDistance)
			this.modulesSetStage(Phases.ENGAGED);
		else if (targetDistance > this.farDistance)
			this.modulesSetStage(Phases.DISENGAGED);

		this.modulesApply(map, intersectionFinder, target);
	}
}

Engage.Stages = Stages;
Engage.Phases = Phases;

module.exports = Engage;

},{"../../util/Enum":66,"../../util/Number":70,"./ModuleManager":21}],20:[function(require,module,exports){
class Module {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStagesMapping(stagesMaps) {
		this.stagesMap = stagesMaps;
	}

	setStage(phase) {
		this.stage = this.stagesMap[phase];
	}

	apply(map, intersectionFinder, origin, target) {
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;

},{}],21:[function(require,module,exports){
const Module = require('./Module');

class ModuleManager extends Module {
	constructor() {
		super();
		this.modules = [];
		this.phase = -1;
	}

	addModule(module) {
		this.modules.push(module);
	}

	modulesSetStage(phase) {
		if (phase === this.phase)
			return;
		this.phase = phase;
		this.modules.forEach(module =>
			module.setStage(phase));
	}

	modulesApply(map, intersectionFinder, player) {
		this.modules.forEach(module =>
			module.apply(map, intersectionFinder, player));
	}

	modulesPaint(painter, camera) {
		this.modules.forEach(module =>
			module.paint(painter, camera));
	}
}

module.exports = ModuleManager;

// todo [low] consider merging moduleManager and module

},{"./Module":20}],22:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {getRectDistance} = require('../../util/Number');
const {UiCs} = require('../../util/UiConstants');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class NearbyDegen extends Module {
	config(origin, range, damage) {
		this.origin = origin;
		this.range = range;
		this.damage = damage;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		let targetDistance = getRectDistance(target.x - this.origin.x, target.y - this.origin.y);
		if (targetDistance < this.range)
			target.changeHealth(-this.damage);
	}

	paint(painter, camera) {
		if (this.stage === Stages.WARNING)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {color: UiCs.Ability.NearybyDegen.WARNING_BORDER.get()}));
		else if (this.stage === Stages.ACTIVE)
			painter.add(RectC.withCamera(camera, this.origin.x, this.origin.y, this.range * 2, this.range * 2, {fill: true, color: UiCs.Ability.NearybyDegen.ACTIVE_FILL.get()}));
	}
}

NearbyDegen.Stages = Stages;

module.exports = NearbyDegen;

},{"../../painter/RectC":59,"../../util/Enum":66,"../../util/Number":70,"../../util/UiConstants":74,"./Module":20}],23:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Trigger = require('../../util/Trigger');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER');

class PhaseSetter extends Module {
	constructor() {
		super();
		this.trigger = new Trigger(Stages.TRIGGER);
	}

	config(phase, phaseValue) {
		this.phase = phase;
		this.phaseValue = phaseValue;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE || this.trigger.trigger(this.stage))
			this.phase.setPhase(this.phaseValue);
		else if (this.stage === Stages.INACTIVE)
			this.trigger.untrigger();
	}
}

PhaseSetter.Stages = Stages;

module.exports = PhaseSetter;

},{"../../util/Enum":66,"../../util/Trigger":73,"./Module":20}],24:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Trigger = require('../../util/Trigger');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER');

class Restore extends Module {
	constructor() {
		super();
		this.trigger = new Trigger(Stages.TRIGGER);
	}

	config(origin) {
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE || this.trigger.trigger(this.stage))
			this.origin.restoreHealth();
		else if (this.stage === Stages.INACTIVE)
			this.trigger.untrigger();
	}
}

Restore.Stages = Stages;

module.exports = Restore;

},{"../../util/Enum":66,"../../util/Trigger":73,"./Module":20}],25:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, randVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Shotgun extends Module {
	config(origin, rate, count, velocity, spread, duration, damage) {
		this.origin = origin;
		this.rate = rate;
		this.count = count;
		this.velicity = velocity;
		this.spread = spread;
		this.duration = duration;
		this.damage = damage;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE || Math.random() > this.rate)
			return;

		for (let i = 0; i < this.count; i++) {
			let directv = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.velicity);
			let randv = randVector(this.spread);

			let projectile = new Projectile(this.origin.x, this.origin.y, .01, .01, directv.x + randv[0], directv.y + randv[1], this.duration, this.damage, false);
			map.addProjectile(projectile);
		}
	}
}

Shotgun.Stages = Stages;

module.exports = Shotgun;

},{"../../util/Enum":66,"../../util/Number":70,"../attack/Projectile":16,"./Module":20}],26:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {UiCs, UiPs} = require('../../util/UiConstants');
const Phase = require('../../util/Phase');
const Engage = require('../module/Engage');
const PhaseSetter = require('../module/PhaseSetter');
const Restore = require('../module/Restore');
const NearbyDegen = require('../module/NearbyDegen');
const Shotgun = require('../module/Shotgun');
const StarShip = require('../../graphics/StarShip');
const Bar = require('../../painter/Bar');

const Phases = makeEnum('INACTIVE', 'PRE_DEGEN', 'DEGEN', 'PROJECTILE');

class Boss1 extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .5);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: UiCs.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0, 100, 100, 200);
		this.attackPhase.setSequentialStartPhase(Phases.PRE_DEGEN);
		this.enragePhase = new Phase(6000);
		this.enragePhase.setPhase(0);

		let engage = new Engage();
		engage.setStagesMapping({
			[Phases.INACTIVE]: Engage.Stages.ACTIVE,
			[Phases.PRE_DEGEN]: Engage.Stages.ACTIVE,
			[Phases.DEGEN]: Engage.Stages.ACTIVE,
			[Phases.PROJECTILE]: Engage.Stages.ACTIVE
		});
		engage.config(this, .5, 1);
		this.moduleManager.addModule(engage);

		let phaseSetterEngageAttack = new PhaseSetter();
		phaseSetterEngageAttack.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.TRIGGER,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.INACTIVE
		}));
		phaseSetterEngageAttack.config(this.attackPhase, Phases.PRE_DEGEN);
		engage.addModule(phaseSetterEngageAttack);

		let phaseSetterEngageEnrage = new PhaseSetter();
		phaseSetterEngageEnrage.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.TRIGGER,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.INACTIVE
		}));
		phaseSetterEngageEnrage.config(this.enragePhase, 0);
		engage.addModule(phaseSetterEngageEnrage);

		let phaseSetterDisengageAttack = new PhaseSetter();
		phaseSetterDisengageAttack.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.TRIGGER
		}));
		phaseSetterDisengageAttack.config(this.attackPhase, Phases.INACTIVE);
		engage.addModule(phaseSetterDisengageAttack);

		let restore = new Restore();
		restore.setStagesMapping(({
			[Engage.Phases.ENGAGED]: Restore.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: Restore.Stages.TRIGGER
		}));
		restore.config(this);
		engage.addModule(restore);

		this.nearbyDegen = new NearbyDegen();
		this.nearbyDegen.setStagesMapping({
			[Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: NearbyDegen.Stages.WARNING,
			[Phases.DEGEN]: NearbyDegen.Stages.ACTIVE,
			[Phases.PROJECTILE]: NearbyDegen.Stages.INACTIVE
		});
		this.moduleManager.addModule(this.nearbyDegen);

		this.shotgun = new Shotgun();
		this.shotgun.setStagesMapping({
			[Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.PROJECTILE]: Shotgun.Stages.ACTIVE
		});
		this.moduleManager.addModule(this.shotgun);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.get() !== Phases.INACTIVE) {
			if (this.attackPhase.sequentialTick())
				this.moduleManager.modulesSetStage(this.attackPhase.get());

			if (this.enragePhase.isNew()) {
				this.nearbyDegen.config(this, .33, .002);
				this.shotgun.config(this, .1, 10, .015, .003, 100, .005);
			}

			if (this.enragePhase.tick()) {
				this.nearbyDegen.config(this, .33, .01);
				this.shotgun.config(this, .1, 30, .018, .006, 100, .005);
			}
		}

		if (this.attackPhase.isNew())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}

	paintUi(painter, camera) {
		if (this.attackPhase.get() === Phases.INACTIVE)
			return;

		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.health.getRatio(),
			UiCs.LIFE.getShade(UiCs.BAR_SHADING), UiCs.LIFE.get(), UiCs.LIFE.getShade(UiCs.BAR_SHADING)));
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN * 2.5, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT * .5, this.enragePhase.getRatio(),
			UiCs.ENRAGE.getShade(), UiCs.ENRAGE.get(), UiCs.ENRAGE.getShade()));
	}
}

module.exports = Boss1;

},{"../../graphics/StarShip":34,"../../painter/Bar":52,"../../util/Enum":66,"../../util/Phase":71,"../../util/UiConstants":74,"../module/Engage":19,"../module/NearbyDegen":22,"../module/PhaseSetter":23,"../module/Restore":24,"../module/Shotgun":25,"./Monster":27}],27:[function(require,module,exports){
const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const ModuleManager = require('../module/ModuleManager');
const {UiCs} = require('../../util/UiConstants');
const BarC = require('../../painter/BarC');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.moduleManager = new ModuleManager();
	}

	update(map, intersectionFinder, player) {
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.moduleManager.modulesPaint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.health.getRatio(),
			UiCs.LIFE.getShade(UiCs.BAR_SHADING), UiCs.LIFE.get(), UiCs.LIFE.getShade(UiCs.BAR_SHADING)));
	}
}

module.exports = Monster;

},{"../../intersection/IntersectionFinder":41,"../../painter/BarC":53,"../../util/UiConstants":74,"../LivingEntity":12,"../module/ModuleManager":21}],28:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {UiCs} = require('../../util/UiConstants');
const Phase = require('../../util/Phase');
const Distance = require('../module/Distance');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const WShip = require('../../graphics/WShip');

const Phases = makeEnum('ONE');

class ShotgunWarrior extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: UiCs.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.setStagesMapping({[Phases.ONE]: Distance.Stages.ACTIVE});
		distance.config(this, .25, .55);
		this.moduleManager.addModule(distance);

		let chase = new Chase();
		chase.setStagesMapping({
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE
		});
		chase.config(this, .003);
		distance.addModule(chase);

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.INACTIVE,
			2: Shotgun.Stages.INACTIVE
		});
		shotgun.config(this, .05, 3, .015, .003, 100, .005);
		distance.addModule(shotgun);

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}
}

module.exports = ShotgunWarrior;

},{"../../graphics/WShip":37,"../../util/Enum":66,"../../util/Phase":71,"../../util/UiConstants":74,"../module/Chase":17,"../module/Distance":18,"../module/Shotgun":25,"./Monster":27}],29:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {UiCs} = require('../../util/UiConstants');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');
const StarShip = require('../../graphics/StarShip');

const Phases = makeEnum('REST', 'ATTACK');

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: UiCs.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setRandomTick();

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.setStagesMapping({
			[Phases.REST]: NearbyDegen.Stages.INACTIVE,
			[Phases.ATTACK]: NearbyDegen.Stages.ACTIVE
		});
		nearbyDegen.config(this, .4, .001);
		this.moduleManager.addModule(nearbyDegen);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}
}

module.exports = Turret;

},{"../../graphics/StarShip":34,"../../util/Enum":66,"../../util/Phase":71,"../../util/UiConstants":74,"../module/NearbyDegen":22,"./Monster":27}],30:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {UiCs} = require('../../util/UiConstants');
const RectC = require('../../painter/RectC');

class Dust extends Entity {
	constructor(x, y, size, vx, vy, time) {
		super(x, y, size, size, IntersectionFinder.Layers.IGNORE);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
	}

	update() {
		const FRICTION = .98;

		if (!this.time--)
			return true;

		this.move(this.vx, this.vy);

		this.vx *= FRICTION;
		this.vy *= FRICTION;
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: UiCs.Entity.DUST.get()}));
	}

}

module.exports = Dust;

},{"../../intersection/IntersectionFinder":41,"../../painter/RectC":59,"../../util/UiConstants":74,"../Entity":11}],31:[function(require,module,exports){
const PathCreator = require('./PathCreator');

class Graphics {
	constructor(width, height, points, {fill, color, thickness} = {}) {
		this.pathCreator = new PathCreator();
		this.pathCreator.setFill(fill);
		this.pathCreator.setColor(color);
		this.pathCreator.setThickness(thickness);
		this.pathCreator.setScale(width, height, Graphics.calculateScale(points));
		points.forEach(point => this.pathCreator.moveTo(...point));
	}

	paint(painter, camera, x, y, moveDirection) {
		this.pathCreator.setCamera(camera);
		this.pathCreator.setTranslation(x, y);
		this.pathCreator.setForward(moveDirection.x, moveDirection.y);
		painter.add(this.pathCreator.create())
	}

	static calculateScale(points) {
		let xs = points.map(([x]) => x);
		let ys = points.map(([_, y]) => y);
		let xd = Math.max(...xs) - Math.min(...xs);
		let yd = Math.max(...ys) - Math.min(...ys);
		return 2 / (xd + yd);
	}
}

module.exports = Graphics;

},{"./PathCreator":32}],32:[function(require,module,exports){
const Path = require('../painter/Path');

class PathCreator {
	constructor() {
		this.xys = [];
		this.cx = .5;
		this.cy = .5;
		this.fx = 0;
		this.fy = -1;
		this.sx = .1;
		this.sy = .1;
		this.x = 0;
		this.y = 0;
		this.pathPoints = [];
	}

	setCamera(camera) {
		this.camera = camera;
	}

	setFill(fill) {
		this.fill = fill;
	}

	setColor(color) {
		this.color = color;
	}

	setThickness(thickness) {
		this.thickness = thickness;
	}

	setTranslation(x, y) {
		if (this.cx === x && this.cy === y)
			return;
		this.cx = x;
		this.cy = y;
	}

	setForward(x, y) {
		if (this.fx === x && this.fy === y)
			return;
		this.fx = x;
		this.fy = y;
	}

	setScale(x, y, s) {
		if (this.sx === x * s && this.sy === y * s)
			return;
		this.sx = x * s;
		this.sy = y * s;
	}

	moveTo(x, y, skipAdd) {
		this.x = x;
		this.y = y;
		skipAdd || this.add();
	}

	moveBy(x, y, skipAdd) {
		this.x += x;
		this.y += y;
		skipAdd || this.add();
	}

	add() {
		this.xys.push([this.x, this.y]);
	}

	create() {
		this.computePathPoints();
		return new Path(this.pathPoints, {fill: this.fill, color: this.color, thickness: this.thickness});
	}

	computePathPoints() {
		// [0, 1] maps to center + forward
		this.pathPoints = [];
		this.xys.forEach(([x, y]) => {
			x *= this.sx;
			y *= this.sy;
			let pathX = this.cx + this.fx * y - this.fy * x;
			let pathY = this.cy + this.fy * y + this.fx * x;
			this.pathPoints.push([this.camera.xt(pathX), this.camera.yt(pathY)]);
		});
	}
}

module.exports = PathCreator;

},{"../painter/Path":57}],33:[function(require,module,exports){
const Graphics = require('./Graphics');
const {PI2, thetaToVector, rand} = require('../util/Number');

// min magnitude of all points will be MIN_MAGNITUDE / (MIN_MAGNITUDE + 1)
const POINTS = 5, MIN_MAGNITUDE = 1;

class RockGraphic extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		let points = [];
		for (let i = 0; i < POINTS; i++)
			points.push(thetaToVector(i * PI2 / POINTS, rand() + MIN_MAGNITUDE));
		super(width, height, points, {fill, color, thickness});
	}
}

module.exports = RockGraphic;

},{"../util/Number":70,"./Graphics":31}],34:[function(require,module,exports){
const Graphics = require('./Graphics');

const S = 1, D = .6, M = .3; // S = 1, D < .7, M < D

const POINTS = [
	[-S, 0], // left
	[-D, M],
	[-D, D],
	[-M, D],
	[0, S], // top
	[M, D],
	[D, D],
	[D, M],
	[S, 0], // right
	[D, -M],
	[D, -D],
	[M, -D],
	[0, -S], // bottom
	[-M, -D],
	[-D, -D],
	[-D, -M],
];

class StarShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, POINTS, {fill, color, thickness});
	}
}

module.exports = StarShip;

},{"./Graphics":31}],35:[function(require,module,exports){
const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');

let points = [];
let n = 20;
for (let i = 0; i < n; i++) {
	let theta = i * PI2 / n;
	let mag = rand() + 2;
	let vector = thetaToVector(theta, mag);
	points.push(vector);
}

class TestShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, points, {fill, color, thickness});
	}
}

module.exports = TestShip;

},{"../util/Number":70,"./Graphics":31}],36:[function(require,module,exports){
const Graphics = require('./Graphics');

const POINTS = [
	[0, 3 / 2], // front
	[1, -1 / 2], // right
	[0, -3 / 2], // back
	[-1, -1 / 2]]; // left

class VShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, POINTS, {fill, color, thickness});
	}
}

module.exports = VShip;

},{"./Graphics":31}],37:[function(require,module,exports){
const Graphics = require('./Graphics');

const POINTS = [
	[1, .5],
	[3, 2],
	[2, -2],
	[0, -1],
	[-2, -2],
	[-3, 2],
	[-1, .5]];

class WShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, POINTS, {fill, color, thickness});
	}
}

module.exports = WShip;

},{"./Graphics":31}],38:[function(require,module,exports){
const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const {UiCs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

const States = makeEnum('INACTIVE', 'ACTIVE', 'HOVER');

class Button extends Interface {
	constructor(text) {
		super();
		this.state = States.INACTIVE;
		this.text = text;
	}

	update(controller) {
		let {x, y} = controller.getRawMouse(0, 0);

		if (!this.bounds.inside(x, y))
			this.state = States.INACTIVE;
		else
			this.state = controller.getMouseState().active ? States.ACTIVE : States.HOVER;
	}

	paint(painter) {
		let color = [UiCs.Interface.INACTIVE, UiCs.Interface.ACTIVE, UiCs.Interface.HOVER][this.state].get();

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;

},{"../painter/Rect":58,"../painter/Text":60,"../util/Enum":66,"../util/UiConstants":74,"./Interface":39}],39:[function(require,module,exports){
const Bounds = require('../intersection/Bounds');

class Interface {
	setPosition(left, top, width, height) {
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		this.bounds = new Bounds(left, top, left + width, top + height);
	}

	update(controller) {
	}

	paint(painter) {
	}
}

module.exports = Interface;

},{"../intersection/Bounds":40}],40:[function(require,module,exports){
const makeEnum = require('../util/Enum');

const Directions = makeEnum('LEFT', 'TOP', 'RIGHT', 'BOTTOM');

class Bounds {
	constructor(...leftTopRightBottom) {
		if (leftTopRightBottom)
			this.set(...leftTopRightBottom);
	}

	set(left, top, right = left, bottom = top) {
		this.values = [];
		this.values[Directions.LEFT] = left;
		this.values[Directions.TOP] = top;
		this.values[Directions.RIGHT] = right;
		this.values[Directions.BOTTOM] = bottom;
	}

	get(direction) {
		return this.values[direction];
	}

	getOpposite(direction) {
		return this.get(Bounds.oppositeDirection(direction));
	}

	intersects(bounds) {
		const signs = [-1, -1, 1, 1];
		return this.values.every((value, direction) =>
			value * signs[direction] > bounds.getOpposite(direction) * signs[direction]);
	}

	inside(x, y){
		return this.intersects(new Bounds(x, y, x, y));
	}

	static oppositeDirection(direction) {
		switch (direction) {
			case Directions.LEFT:
				return Directions.RIGHT;
			case Directions.TOP:
				return Directions.BOTTOM;
			case Directions.RIGHT:
				return Directions.LEFT;
			case Directions.BOTTOM:
				return Directions.TOP;
		}
	}
}

Bounds.Directions = Directions;

module.exports = Bounds;

},{"../util/Enum":66}],41:[function(require,module,exports){
const makeEnum = require('../util/Enum');
const LinkedList = require('../util/LinkedList');
const {EPSILON, maxWhich, setMagnitude} = require('../util/Number');
const Bounds = require('./Bounds');

const Layers = makeEnum(
	'PASSIVE',              // intersects with everything
	'FRIENDLY_PROJECTILE',  // intersects with hostile units and passives
	'FRIENDLY_UNIT',        // intersects with hostile units, hostile projectiles, and passives
	'HOSTILE_PROJECTILE',   // intersects with friendly units and passives
	'HOSTILE_UNIT',         // intersects with friendly units, hostile units, friendly projectiles, and passives
	'IGNORE');              // intersects with nothing

class IntersectionFinder {
	constructor() {
		this.collisions = Object.keys(Layers).map(() => []);
		this.boundsGroups = Object.keys(Layers).map(() => new LinkedList());

		this.initCollisions();
	}

	initCollisions() {
		// passives intersect with everything
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_UNIT);

		// friendly projectiles intersect with hostile units and passives
		this.addCollision(Layers.FRIENDLY_PROJECTILE, Layers.HOSTILE_UNIT);

		// friendly units intersect with hostile units, hostile projectiles, and passives
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_UNIT);
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_PROJECTILE);

		// hostile projectiles intersect with friendly units and passives

		// hostile uints intersects with friendly units, hostile units, friendly projectiles, and passives
		this.addCollision(Layers.HOSTILE_UNIT, Layers.HOSTILE_UNIT);
	}

	addCollision(layer1, layer2) {
		this.collisions[layer1][layer2] = true;
		this.collisions[layer2][layer1] = true;
	}

	addBounds(layer, bounds, reference) {
		return this.boundsGroups[layer].add({bounds, reference})
	}

	removeBounds(layer, item) {
		return this.boundsGroups[layer].remove(item);
	}

	hasIntersection(layer, bounds) {
		let item = this.boundsGroups[layer].find(({bounds: iBounds}) =>
			iBounds.intersects(bounds));
		return item && item.value.reference;
	}

	canMove(layer, bounds, dx, dy, magnitude, noSlide) {
		// if magnitude is -1, then <dx, dy> is not necessarily a unit vector, and its magnitude should be used
		if (magnitude === -1)
			({x: dx, y: dy, prevMagnitude: magnitude} = setMagnitude(dx, dy));

		if (!dx && !dy || magnitude <= 0)
			return [0, 0];

		let moveX = 0, moveY = 0;

		let horizontal = dx <= 0 ? Bounds.Directions.LEFT : Bounds.Directions.RIGHT;
		let vertical = dy <= 0 ? Bounds.Directions.TOP : Bounds.Directions.BOTTOM;

		let intersectionReference;
		if (dx && dy) {
			let {move, side, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);

			moveX += dx * move;
			moveY += dy * move;
			magnitude -= move;

			if (!side || noSlide)
				return [moveX, moveY, reference];
			else if (side === 1) {
				horizontal = Bounds.Directions.LEFT;
				dx = 0;
			} else {
				vertical = Bounds.Directions.TOP;
				dy = 0;
			}

			intersectionReference = reference;
		}

		let {move, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);
		moveX += dx * move;
		moveY += dy * move;

		return [moveX, moveY, intersectionReference || reference]; // todo [low] don't return list
		// todo [low] return list of all intersection references
	}

	checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
		let intersection = {move: magnitude}; // side: 0 = none, 1 = horizontal, 2 = vertical

		this.collisions[layer].forEach((_, iLayer) =>
			this.boundsGroups[iLayer].forEach(({bounds: iBounds, reference}) => {
				if (iBounds === bounds)
					return;
				let iIntersection = IntersectionFinder.checkMoveEntityIntersection(bounds, dx, dy, intersection.move, horizontal, vertical, iBounds);
				if (iIntersection)
					intersection = {...iIntersection, reference};
			}));

		return intersection;
	}

	static checkMoveEntityIntersection(bounds, dx, dy, magnitude, horizontal, vertical, iBounds) {
		let horizontalDelta = IntersectionFinder.getDelta(horizontal, dx, bounds, iBounds, false);
		let verticalDelta = IntersectionFinder.getDelta(vertical, dy, bounds, iBounds, false);

		if (horizontalDelta >= magnitude || verticalDelta >= magnitude || horizontalDelta < 0 && verticalDelta < 0)
			return;

		let [maxDelta, whichDelta] = maxWhich(horizontalDelta, verticalDelta);

		let horizontalFarDelta = IntersectionFinder.getDelta(horizontal, dx, bounds, iBounds, true);
		let verticalFarDelta = IntersectionFinder.getDelta(vertical, dy, bounds, iBounds, true);

		if (maxDelta >= 0 && maxDelta < Math.min(horizontalFarDelta, verticalFarDelta))
			return {move: Math.max(maxDelta - EPSILON, 0), side: whichDelta + 1};
	}

	static getDelta(direction, d, bounds, iBounds, far) {
		if (d) {
			if (far)
				direction = Bounds.oppositeDirection(direction);
			return (iBounds.getOpposite(direction) - bounds.get(direction)) / d;
		}

		return iBounds.getOpposite(direction) > bounds.get(direction) && iBounds.get(direction) < bounds.getOpposite(direction) ^ far
			? 0 : Infinity;
	}
}

IntersectionFinder.Layers = Layers;

module.exports = IntersectionFinder;

// todo [low] support rectangular mobile (rotating)entities

},{"../util/Enum":66,"../util/LinkedList":68,"../util/Number":70,"./Bounds":40}],42:[function(require,module,exports){
const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MapGenerator = require('../map/MapGenerator');
const Minimap = require('../map/Minimap');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.keymapping = new Keymapping();
		this.map = new Map();
		this.player = new Player();
		MapGenerator.generateSample(this.map, this.player);
		this.minimap = new Minimap(this.map);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(...this.map.getSize());
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.camera.move(this.player, this.controller.getRawMouse(.5, .5));
		this.camera.zoom(this.controller, this.keymapping);
		this.controller.inverseTransformMouse(this.camera);
		this.map.update(this.controller, this.keymapping);
		this.minimap.update(this.controller, this.keymapping);
	}

	paint() {
		this.starfield.paint(this.painter, this.camera);
		this.map.paint(this.painter, this.camera);
		this.minimap.paint(this.painter);
		if (UI)
			this.map.paintUi(this.painter, this.camera)
	}
}

module.exports = Game;

// todo [graphics]
// textures
// ui interface

// todo [content]
// map generation
// instances
// mobs
// sector modes
// resources
// crafting
// skill leveling

// todo [other]
// chat
// save
// minimap

// todo [monster]
// skirmersher
// laser, short range raiders
// latchers that reduce max health
// linkers that reduce speed and drain health
// traps
// dots

},{"../camera/Camera":7,"../control/Keymapping":9,"../entities/Player":13,"../map/Map":49,"../map/MapGenerator":50,"../map/Minimap":51,"../starfield/Starfield":62,"./Logic":45}],43:[function(require,module,exports){
const Logic = require('./Logic');
const Color = require('../util/Color');
const TestShip = require('../graphics/TestShip');
const {thetaToVector} = require('../util/Number');

const idf = a => a;

class GraphicsDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.w = .3;
		this.h = .3;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .2 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h, {color: Color.from1(0, 0, 1)});
		this.fakeCamera = {xt: idf, yt: idf};
	}

	iterate() {
		let direction = thetaToVector(this.theta += this.dtheta);
		this.ship.paint(this.painter, this.fakeCamera, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

module.exports = GraphicsDemo;

},{"../graphics/TestShip":35,"../util/Color":64,"../util/Number":70,"./Logic":45}],44:[function(require,module,exports){
const Logic = require('./Logic');
const Interface = require('../interface/Interface');
const Button = require('../interface/Button');

class InterfaceDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);

		this.interface = new Button();
		this.interface.setPosition(.25, .25, .2, .04);
	}

	iterate() {
		this.interface.update(this.controller);
		this.interface.paint(this.painter);
	}
}

module.exports = InterfaceDemo;

},{"../interface/Button":38,"../interface/Interface":39,"./Logic":45}],45:[function(require,module,exports){
class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
	}

	iterate() {
	}
}

module.exports = Logic;

},{}],46:[function(require,module,exports){
const LinkedList = require('../util/LinkedList');
const Entity = require('../entities/Entity');
const Logic = require('./Logic');
const MapGenerator = require('../map/MapGenerator');
const Camera = require('../camera/Camera');
const Rect = require('../painter/Rect');
const Color = require('../util/Color');
const RectC = require('../painter/RectC');

class FakePlayer {
	setPosition() {
	}
}

class FakeMap {
	constructor() {
		this.rocks = new LinkedList();
		this.monsters = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}

	addRock(rock) {
		this.rocks.add(rock);
	}

	addPlayer(player) {
	}

	addMonster(monster) {
		this.monsters.add(monster);
	}

	paint(painter, camera) {
		this.rocks.forEach(rock => rock.paint(painter, camera));
		this.monsters.forEach(monster => Entity.prototype.paint.call(monster, painter, camera)); // to avoid painting modules
	}
}

class MapDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.reset();
		this.camera = new Camera(this.map.width / 2, this.map.height / 2, (this.map.width + this.map.height) / 2);
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		MapGenerator.generateSample(this.map, this.player);
	}

	iterate() {
		if (this.controller.getKeyState(' ').pressed)
			this.reset();

		this.updateCamera();

		this.painter.add(new Rect(0, 0, 1, 1, {fill: true}));
		this.painter.add(RectC.withCamera(this.camera, this.map.width / 2, this.map.height / 2, this.map.width, this.map.height, {color: Color.WHITE.get(), thickness: 2}));
		this.map.paint(this.painter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x * this.map.width, y: y * this.map.height}, {x, y});
	}
}

module.exports = MapDemo;

},{"../camera/Camera":7,"../entities/Entity":11,"../map/MapGenerator":50,"../painter/Rect":58,"../painter/RectC":59,"../util/Color":64,"../util/LinkedList":68,"./Logic":45}],47:[function(require,module,exports){
const Logic = require('./Logic');
const {NoiseSimplex, NoiseGradient} = require('../util/Noise');
const {rand} = require('../util/Number');
const Color = require('../util/Color');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');
const Text = require('../painter/Text');

const THRESHOLD = .5;
const N = 200; // resolution
const NTH = 1 / N;
const DEFAULT_NOISE_RANGE = 20; // feature sizes, bigger noiseRange means smaller features

class NoiseDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.noiseRange = DEFAULT_NOISE_RANGE;
		this.reset();
	}

	reset() {
		this.results = [];
		let noise = new NoiseSimplex(this.noiseRange);
		for (let x = 0; x < N; x++) {
			this.results[x] = [];
			for (let y = 0; y < N; y++) {
				let r = noise.get(x * NTH, y * NTH);
				if (r > THRESHOLD + rand())
					this.results[x][y] = true;
			}
		}
	}

	iterate() {
		this.control();
		this.paint();
	}

	control() {
		if (this.controller.getKeyState('arrowdown').pressed)
			this.noiseRange -= 5;
		if (this.controller.getKeyState('arrowup').pressed)
			this.noiseRange += 5;
		if (this.controller.getKeyState('arrowleft').pressed)
			this.noiseRange--;
		if (this.controller.getKeyState('arrowright').pressed)
			this.noiseRange++;
		if (this.controller.getKeyState(' ').pressed)
			this.reset();
	}

	paint() {
		for (let x = 0; x < N; x++)
			for (let y = 0; y < N; y++) {
				if (this.results[x][y]) {
					this.painter.add(new Rect(x * NTH, y * NTH, 1 / N, 1 / N, {fill: true, color: Color.BLACK.get()}));
					this.painter.add(new RectC(.1, .1, .03, .03, {fill: true, color: `#fff`}));
					this.painter.add(new Text(.1, .1, this.noiseRange));
				}
			}
	}
}

module.exports = NoiseDemo;

},{"../painter/Rect":58,"../painter/RectC":59,"../painter/Text":60,"../util/Color":64,"../util/Noise":69,"../util/Number":70,"./Logic":45}],48:[function(require,module,exports){
const Logic = require('./Logic');
const Camera = require('../camera/Camera');
const Color = require('../util/Color');
const Text = require('../painter/Text');
const Starfield = require('../starfield/Starfield');
const StarfieldNoise = require('../starfield/StarfieldNoise');

class StarfieldDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.camera = new Camera(0, 0, 1);
	}

	iterate() {
		this.periodicallySwapStarfield();
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
		this.starfield.paint(this.painter, this.camera);
		this.painter.add(new Text(.05, .05, this.noise ? 'noise' : 'rand', {color: Color.WHITE.get()}));
	}

	periodicallySwapStarfield() {
		if (!this.iter) {
			this.iter = 100;
			this.noise = !this.noise;
			this.starfield = this.noise ? new StarfieldNoise(1, 1) : new Starfield(1, 1);
		}
		this.iter--;
	}
}

module.exports = StarfieldDemo;

},{"../camera/Camera":7,"../painter/Text":60,"../starfield/Starfield":62,"../starfield/StarfieldNoise":63,"../util/Color":64,"./Logic":45}],49:[function(require,module,exports){
const IntersectionFinder = require('../intersection/IntersectionFinder');
const LinkedList = require('../util/LinkedList');

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
		this.rocks = new LinkedList();
		this.monsters = new LinkedList();
		this.projectiles = new LinkedList();
		this.particles = new LinkedList();
		this.uis = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}

	getSize() {
		return [this.width, this.height];
	}

	addRock(rock) {
		this.rocks.add(rock);
		rock.addIntersectionBounds(this.intersectionFinder);
	}

	addPlayer(player) {
		this.player = player;
		player.addIntersectionBounds(this.intersectionFinder);
		this.uis.add(player);
	}

	addMonster(monster, ui) {
		this.monsters.add(monster);
		monster.addIntersectionBounds(this.intersectionFinder);
		if (ui)
			this.uis.add(monster);
	}

	addProjectile(projectile) {
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	addParticle(particle) {
		this.particles.add(particle);
	}

	update(controller, keymapping) {
		this.player.update(this, controller, keymapping, this.intersectionFinder);
		this.monsters.forEach((monster, item) => {
			if (monster.health.isEmpty()) {
				this.monsters.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
			} else
				monster.update(this, this.intersectionFinder, this.player);
		});
		this.projectiles.forEach((projectile, item) => {
			if (projectile.update(this, this.intersectionFinder)) {
				this.projectiles.remove(item);
				projectile.removeIntersectionBounds(this.intersectionFinder);
			}
		});
		this.particles.forEach((particle, item) => {
			if (particle.update())
				this.particles.remove(item);
		});
	}

	paint(painter, camera) {
		this.rocks.forEach(rock => rock.paint(painter, camera));
		this.player.paint(painter, camera);
		this.monsters.forEach(monster => monster.paint(painter, camera));
		this.projectiles.forEach(projectile => projectile.paint(painter, camera));
		this.particles.forEach(particle => particle.paint(painter, camera));
	}

	paintUi(painter, camera) {
		this.uis.forEach(ui => {
			if (ui.health.isEmpty())
				this.uis.remove(ui);
			else
				ui.paintUi(painter, camera);
		});
	}
}

module.exports = Map;

// todo [medium] consider static & dynamic entity lists in stead of individual type entity lists

},{"../intersection/IntersectionFinder":41,"../util/LinkedList":68}],50:[function(require,module,exports){
const {rand} = require('../util/Number');
const Rock = require('../entities/Rock');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const {NoiseSimplex} = require('../util/Noise');

const WIDTH = 10, HEIGHT = WIDTH;

class MapGenerator {

	static generateSample(map, player) {
		const ROCKS = 100, TURRETS = 0, SHOTGUN_WARRIORS = 100;
		const ROCK_MAX_SIZE = .1;

		let noise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		player.setPosition(...noise.positionsLowest(100, WIDTH, HEIGHT));
		map.addPlayer(player);

		noise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => map.addRock(new Rock(...position, rand(ROCK_MAX_SIZE))));
		noise.positions(TURRETS, WIDTH, HEIGHT).forEach(position => map.addMonster(new Turret(...position)));
		noise.positions(SHOTGUN_WARRIORS, WIDTH, HEIGHT).forEach(position => map.addMonster(new ShotgunWarrior(...position)));
		noise.positions(1, WIDTH, HEIGHT).forEach(position => map.addMonster(new Boss1(...position), true));
	}
}

module.exports = MapGenerator;

},{"../entities/Rock":14,"../entities/monsters/Boss1":26,"../entities/monsters/ShotgunWarrior":28,"../entities/monsters/Turret":29,"../util/Noise":69,"../util/Number":70}],51:[function(require,module,exports){
const Keymapping = require('../control/Keymapping');
const Camera = require('../camera/Camera');
const {UiCs} = require('../util/UiConstants');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Minimap {
	constructor(map) {
		this.map = map;
	}

	toggleZoom() {
		this.zoom = !this.zoom;
	}

	update(controller, keymapping) {
		if (keymapping.getKeyState(controller, Keymapping.Keys.MINIMAP_ZOOM).pressed)
			this.toggleZoom();
	}

	createCamera() {
		const OFFSET = .01, SCALE_BASE_SMALL = .15, SCALE_BASE_LARGE = .4;
		let scale = (this.zoom ? SCALE_BASE_LARGE : SCALE_BASE_SMALL);
		return Camera.createForRegion(this.map.width, OFFSET, OFFSET, scale);
	}

	paint(painter) {
		let camera = this.createCamera();
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: true, color: UiCs.Minimap.BACKGROUND.get()}));
		this.map.rocks.forEach(rock => Minimap.paintDot(painter, camera, rock.x, rock.y, UiCs.Minimap.ROCK.get()));
		this.map.monsters.forEach(monster => Minimap.paintDot(painter, camera, monster.x, monster.y, UiCs.Minimap.MONSTER.get()));
		this.map.uis.forEach(ui => Minimap.paintDot(painter, camera, ui.x, ui.y, UiCs.Minimap.BOSS.get()));
		Minimap.paintDot(painter, camera, this.map.player.x, this.map.player.y, UiCs.Minimap.PLAYER.get());
	}

	static paintDot(painter, camera, x, y, color) {
		const DOT_SIZE = .2;
		painter.add(RectC.withCamera(camera, x, y, DOT_SIZE, DOT_SIZE, {fill: true, color}));
	}
}

module.exports = Minimap;

},{"../camera/Camera":7,"../control/Keymapping":9,"../painter/Rect":58,"../painter/RectC":59,"../util/UiConstants":74}],52:[function(require,module,exports){
const PainterElement = require('./PainterElement');
const Rect = require('./Rect');

class Bar extends PainterElement {
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		this.empty = new Rect(x, y, width, height, {fill: true, color: emptyColor});
		this.fill = new Rect(x, y, width * fillRatio, height, {fill: true, color: fillColor});
		this.border = new Rect(x, y, width, height, {color: borderColor});
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

module.exports = Bar;

},{"./PainterElement":56,"./Rect":58}],53:[function(require,module,exports){
const PainterElement = require('./PainterElement');
const Rect = require('./Rect');

class BarC extends PainterElement {
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		x -= width / 2;
		y -= height / 2;
		this.empty = new Rect(x, y, width, height, {fill: true, color: emptyColor});
		this.fill = new Rect(x, y, width * fillRatio, height, {fill: true, color: fillColor});
		this.border = new Rect(x, y, width, height, {color: borderColor});
	}

	static withCamera(camera, x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		return new BarC(camera.xt(x), camera.yt(y), camera.st(width), camera.st(height), fillRatio, emptyColor, fillColor, borderColor);
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

module.exports = BarC;

},{"./PainterElement":56,"./Rect":58}],54:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Line extends PainterElement {
	constructor(x, y, x2, y2, {color = '#000', thickness = 1} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.x2 = x2;
		this.y2 = y2;
		this.color = color;
		this.thickness = thickness
	}

	static withCamera(camera, x, y, x2, y2, {color, thickness} = {}) {
		return new Line(camera.xt(x), camera.yt(y), camera.xt(x2), camera.yt(y2), {color, thickness});
	}

	paint(xt, yt, context) {
		this.setLineMode(context);
		context.beginPath();
		context.moveTo(xt(this.x), yt(this.y));
		context.lineTo(xt(this.x2), yt(this.y2));
		context.stroke();
	}
}

module.exports = Line;

},{"./PainterElement":56}],55:[function(require,module,exports){
class Painter {
	constructor(canvas) {
		this.width = canvas.width;
		this.height = canvas.height;
		// this.createMask();
		this.xCoordinateTransform = x => x * this.width;
		this.yCoordinateTransform = y => y * this.height;
		this.context = canvas.getContext('2d');
		this.setFontMode();
		this.elements = [];
	}

	createMask() {
		this.maskCanvas = document.createElement('canvas'); // todo [low] better way of creating canvas
		this.maskCanvas.width = this.width;
		this.maskCanvas.height = this.height;
		this.maskContext = this.maskCanvas.getContext('2d');
	}

	setFontMode() {
		this.context.font = '18px monospace';
		this.context.textAlign = 'center';
		this.context.textBaseline = 'middle';
	}

	clear() {
		this.elements = [];
	}

	add(element) {
		this.elements.push(element);
	}

	paint() {
		this.context.clearRect(0, 0, this.width, this.height);
		this.elements.forEach(element =>
			element.paint(this.xCoordinateTransform, this.yCoordinateTransform, this.context));

		// this.maskContext.globalCompositeOperation = 'source-over';
		// this.maskContext.fillStyle = "black";
		// this.maskContext.fillRect(0, 0, this.width, this.height);
		// this.maskContext.globalCompositeOperation = 'xor';
		// this.maskContext.fillRect(100, 100, 500, 500);
		// this.context.drawImage(this.maskCanvas, 0, 0);
	}
}

module.exports = Painter;

},{}],56:[function(require,module,exports){
class PainterElement {
	setFillMode(context) {
		context.fillStyle = this.color;
	}

	setLineMode(context) {
		context.strokeStyle = this.color;
		context.lineWidth = this.thickness;
	}

	paint(painter) {
	}
}

module.exports = PainterElement;

},{}],57:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Path extends PainterElement {
	constructor(xys, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.xys = xys;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
	}

	paint(xt, yt, context) {
		if (this.fill) {
			this.setFillMode(context);
			this.paintPath(xt, yt, context);
			context.fill();
		} else {
			this.setLineMode(context);
			this.paintPath(xt, yt, context);
			context.stroke();
		}
	}

	paintPath(xt, yt, context) {
		context.beginPath();
		let xyt = xy => [xt(xy[0]), yt(xy[1])];
		context.moveTo(...xyt(this.xys[0]));
		this.xys.forEach(xy =>
			context.lineTo(...xyt(xy)));
		context.closePath();
	}
}

module.exports = Path;

},{"./PainterElement":56}],58:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Rect extends PainterElement {
	constructor(x, y, width, height, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
	}

	static withCamera(camera, x, y, width, height, {fill, color, thickness} = {}) {
		return new Rect(camera.xt(x), camera.yt(y), camera.st(width), camera.st(height), {fill, color, thickness});
	}

	paint(xt, yt, context) {
		let tx = xt(this.x);
		let ty = yt(this.y);
		let tWidth = xt(this.width);
		let tHeight = xt(this.height);

		if (this.fill) {
			this.setFillMode(context);
			context.fillRect(tx, ty, tWidth, tHeight);
		} else {
			this.setLineMode(context);
			context.strokeRect(tx, ty, tWidth, tHeight);
		}
	}
}

module.exports = Rect;

},{"./PainterElement":56}],59:[function(require,module,exports){
const Rect = require('./Rect');

class RectC extends Rect {
	// todo [low] refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
	constructor(centerX, centerY, width, height, {fill, color, thickness} = {}) {
		super(centerX - width / 2, centerY - height / 2, width, height, {fill, color, thickness});
	}

	static withCamera(camera, centerX, centerY, width, height, {fill, color, thickness} = {}) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), {fill, color, thickness});
	}
}

module.exports = RectC;

},{"./Rect":58}],60:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Text extends PainterElement {
	constructor(x, y, text, {color = '#000'} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
	}

	paint(xt, yt, context) {
		let tx = xt(this.x);
		let ty = yt(this.y);
		this.setFillMode(context);
		context.fillText(this.text, tx, ty);
	}
}

module.exports = Text;

},{"./PainterElement":56}],61:[function(require,module,exports){
const {UiCs} = require('../util/UiConstants');
const {rand, randInt} = require('../util/Number');
const RectC = require('../painter/RectC');

const FLICKER_COLOR_MULT = .7;
const STAR_COLOR_ARRAY = [
	[UiCs.Star.WHITE, UiCs.Star.WHITE.multiply(FLICKER_COLOR_MULT)],
	[UiCs.Star.BLUE, UiCs.Star.BLUE.multiply(FLICKER_COLOR_MULT)]];

class Star {
	constructor(x, y, z, size, blue) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.size = size;
		this.blue = blue;
	}

	paint(painter, camera) {
		const FLICKER_RATE = .003;

		let x = camera.xt(this.x, this.z);
		let y = camera.yt(this.y, this.z);
		let s = camera.st(this.size, this.z);

		if (this.flicker)
			this.flicker--;
		else if (rand() < FLICKER_RATE)
			this.flicker = randInt(75);

		let color = STAR_COLOR_ARRAY[this.blue ? 1 : 0][this.flicker ? 1 : 0];
		painter.add(new RectC(x, y, s, s, {fill: true, color: color.get()}));
	}
}

module.exports = Star;

},{"../painter/RectC":59,"../util/Number":70,"../util/UiConstants":74}],62:[function(require,module,exports){
const {rand, randB} = require('../util/Number');
const Star = require('./Star');
const RectC = require('../painter/RectC');

class Starfield {
	constructor(width, height, extra = 0) {
		const DEPTH = 20 + extra * 20, FORWARD_DEPTH = .8,
			WIDTH = width * DEPTH, HEIGHT = height * DEPTH,
			COUNT = 10 * WIDTH * HEIGHT,
			SIZE = .03 + extra * .03, BLUE_RATE = .05;

		this.stars = [];
		for (let i = 0; i < COUNT; i++) {
			let x = randB(WIDTH);
			let y = randB(HEIGHT);
			let z = rand(DEPTH) - FORWARD_DEPTH;
			if (x > z || x < -z || y > z || y < -z)
				continue;
			let size = rand(SIZE);
			this.stars.push(new Star(x, y, z, size, rand() < BLUE_RATE));
		}
	}

	paint(painter, camera) {
		// painter.add(new RectC(.5, .5, 1, 1, {fill: true}));
		this.stars.forEach(star => star.paint(painter, camera));
	}
}

module.exports = Starfield;

},{"../painter/RectC":59,"../util/Number":70,"./Star":61}],63:[function(require,module,exports){
const Starfield = require('./Starfield');
const {NoiseSimplex} = require('../util/Noise');
const {rand} = require('../util/Number');
const Star = require('./Star');
const RectC = require('../painter/RectC');

// this class is only for the StarfieldDemo
class StarfieldNoise extends Starfield {
	constructor(width, height, extra = 0) {
		super(0, 0, 0);

		const DEPTH = 20 + extra * 20, FORWARD_DEPTH = .8,
			WIDTH = width * DEPTH, HEIGHT = height * DEPTH,
			COUNT = 10 * WIDTH * HEIGHT,
			SIZE = .03 + extra * .03, BLUE_RATE = .05;

		let noise = new NoiseSimplex(8);

		this.stars = noise.positions(COUNT, WIDTH, HEIGHT).map(([x, y]) => {
			x -= WIDTH / 2;
			y -= HEIGHT / 2;
			let z = rand(DEPTH);
			if (x > z || x < -z || y > z || y < -z)
				return null;
			let size = rand(SIZE);
			return new Star(x, y, z, size, rand() < BLUE_RATE);
		}).filter(star => star);
	}
}

module.exports = StarfieldNoise;

},{"../painter/RectC":59,"../util/Noise":69,"../util/Number":70,"./Star":61,"./Starfield":62}],64:[function(require,module,exports){
const {clamp} = require('./Number');

const SHADE_ADD = 1;

class Color {
	constructor(r, g, b, a = 1) {
		this.r = clamp(r, 0, 255);
		this.g = clamp(g, 0, 255);
		this.b = clamp(b, 0, 255);
		this.a = clamp(a, 0, 1);
		this.string = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}

	static from255(r, g, b, a) {
		return new Color(r, g, b, a);
	}

	static from1(r1, g1, b1, a) {
		return new Color(...[r1, g1, b1].map(Color.oneTo255), a);
	}

	static fromHex(rh, gh, bh, a) {
		return new Color(...[rh, gh, bh].map(Color.hexTo255), a)
	}

	static fromHexString(hex) {
		if (hex[0] === '#')
			hex = hex.substr(1);

		if (hex.length === 3)
			return Color.from255(
				Color.hexTo255(parseInt(hex[0], 16)),
				Color.hexTo255(parseInt(hex[1], 16)),
				Color.hexTo255(parseInt(hex[2], 16)));

		return Color.from255(
			parseInt(hex.substr(0, 2), 16),
			parseInt(hex.substr(2, 2), 16),
			parseInt(hex.substr(4, 2), 16));
	}

	multiply(mult) {
		return new Color(this.r * mult, this.g * mult, this.b * mult, this.a);
	}

	alphaMultiply(mult) {
		return new Color(this.r, this.g, this.b, this.a * mult);
	}

	get() {
		return this.string;
	}

	// shade should be 0 (no shading) to 1 (maximum shading)
	getShade(shade = 1) {
		if (shade === 1)
			return this.shadeString || (this.shadeString = this.multiply(1 + SHADE_ADD).get());
		return this.multiply(1 + SHADE_ADD * shade).get();
	}

	getAlpha(alphaMult = 1) {
		const NO_COLOR = Color.from1(0, 0, 0, 0);
		if (alphaMult === 1)
			return this.string;
		if (alphaMult === 0)
			return NO_COLOR.get();
		return this.alphaMultiply(alphaMult).get();
	}

	static hexTo255(hex) {
		return hex * 17
	}

	static oneTo255(one) {
		return parseInt(one * 255);
	}
}

Color.WHITE = Color.from1(0, 0, 0);
Color.BLACK = Color.from1(0, 0, 0);

module.exports = Color;

},{"./Number":70}],65:[function(require,module,exports){
class Decay {
	constructor(max, decayRate) {
		this.max = max;
		this.decayRate = decayRate;
		this.value = 0;
	}

	add(amount) {
		if (amount > 0)
			this.value = Math.min(this.value + amount, this.max + this.decayRate);
	}

	get() {
		if (this.value > 0)
			this.value = Math.max(this.value - this.decayRate, 0);
		return this.value / this.max;
	}
}

module.exports = Decay;

},{}],66:[function(require,module,exports){
const makeEnum = (...values) => {
	let enumb = {};
	values.forEach((value, index) => enumb[value] = index);
	return enumb;
};

module.exports = makeEnum;

},{}],67:[function(require,module,exports){
class Item {
    constructor(value, prev) {
        this.value = value;
        this.prev = prev;
    }
}

module.exports = Item;

},{}],68:[function(require,module,exports){
const Item = require('./Item');

class LinkedList {
	add(value) {
		return !this.head
			? this.tail = this.head = new Item(value)
			: this.tail = this.tail.next = new Item(value, this.tail);
	}

	remove(item) {
		if (item.prev)
			item.prev.next = item.next;
		if (item.next)
			item.next.prev = item.prev;
		if (this.head === item)
			this.head = item.next;
		if (this.tail === item)
			this.tail = item.prev;
	}

	forEach(handler) {
		let iter = this.head;
		while (iter) {
			handler(iter.value, iter);
			iter = iter.next;
		}
	}

	find(handler) {
		let iter = this.head;
		while (iter) {
			if (handler(iter.value, iter))
				return iter;
			iter = iter.next;
		}
	}
}

module.exports = LinkedList;

},{"./Item":67}],69:[function(require,module,exports){
const SimplexNoise = require('simplex-noise');

const {EPSILON, getMagnitude, rand} = require('./Number');

class NoiseSimplex {
	constructor(scale = 10, threshold = .5, thresholdRandWeight = 1) {
		this.scale = scale;
		this.threshold = threshold;
		this.thresholdRandWeight = thresholdRandWeight;
		this.simplexNoise = new SimplexNoise(rand);
	}

	get(x, y) {
		return this.simplexNoise.noise2D(x * this.scale + 1, y * this.scale) * .5 + .5; // seems like simplexNoise implementation is bugged to always return 0 at (0, 0)
	}

	// not consistent, calling it multiple times with same paramters can yield different results
	getB(x, y) {
		return this.get(x, y) > this.threshold + rand(this.thresholdRandWeight);
	}

	// return count number of positions within range [[0 - width], [0 - height]], structured as 2d array
	// not consistent, calling it multiple times with same paramters can yield different results
	positions(count, width, height) {
		let positions = [];
		while (positions.length < count) {
			let x = rand();
			let y = rand();
			if (this.getB(x, y))
				positions.push([x * width, y * height]);
		}
		return positions;
	}

	// return position with lowest noise value of count random positions, within range [[0 - width], [0 - height]]
	// not consistent, calling it multiple times with same paramters can yield different results
	positionsLowest(count, width, height) {
		let position = [];
		let minNoise = 1;
		for (let i = 0; i < count; i++) {
			let x = rand();
			let y = rand();
			let noise = this.get(x, y);
			if (noise < minNoise) {
				minNoise = noise;
				position = [x * width, y * height];
			}
		}
		return position;
	}

}

class NoiseGradient {
	constructor() {
		this.points = [];
		for (let i = 0; i < 1000; i++)
			this.points.push([rand(), rand(), rand()]);
	}

	get(x, y) {
		let weight = 0;
		let z = 0;
		this.points.forEach(([px, py, pz]) => {
			let d = getMagnitude(px - x, py - y);
			d = 1 / (d + EPSILON);
			weight += d;
			z += pz * d;
		});
		return z / weight;
	}
}

module.exports = {NoiseSimplex, NoiseGradient};

},{"./Number":70,"simplex-noise":1}],70:[function(require,module,exports){
const EPSILON = 1e-10, PI = Math.PI, PI2 = PI * 2;

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

const getMagnitude = (x, y) =>
	Math.sqrt(x * x + y * y);

const setMagnitude = (x, y, magnitude = 1) => {
	let prevMagnitude = getMagnitude(x, y);
	if (!prevMagnitude)
		return {x: magnitude, y: 0, prevMagnitude};
	let mult = magnitude / prevMagnitude;
	return {x: x * mult, y: y * mult, prevMagnitude};
};

const clamp = (x, min, max) => {
	if (x < min)
		return min;
	return x > max ? max : x;
};

const thetaToVector = (theta, magnitude = 1) => [cos(theta) * magnitude, sin(theta) * magnitude];

const cos = theta => Math.cos(theta);

const sin = theta => Math.sin(theta);

const booleanArray = array => array.some(a => a);

const avg = (a, b, weight = .5) => a * weight + b * (1 - weight);

const rand = (max = 1) => Math.random() * max;

const randB = (max = 1) => rand(max) - max / 2;

const randInt = max => parseInt(rand(max));

const randVector = magnitude =>
	thetaToVector(rand(PI2), rand(magnitude));

module.exports = {EPSILON, PI, PI2, maxWhich, getDiamondDistance, getRectDistance, getMagnitude, setMagnitude, clamp, thetaToVector, cos, sin, booleanArray, avg, rand, randB, randInt, randVector};

},{}],71:[function(require,module,exports){
const {randInt} = require('./Number');

class Phase {
	// durations should be >= 0
	constructor(...durations) {
		this.durations = durations;
		this.setSequentialStartPhase(0);
		this.setPhase(0);
	}

	setSequentialStartPhase(phase) {
		this.sequentialStartPhase = phase;
	}

	setPhase(phase) {
		this.phase = phase;
		this.duration = this.durations[phase];
	}

	setRandomTick() {
		this.duration = randInt(this.durations[this.phase]) + 1;
	}

	nextPhase() {
		this.setPhase(++this.phase < this.durations.length ? this.phase : this.sequentialStartPhase);
	}

	// return true if phase ends (e.g., duration equaled 1)
	tick() {
		return this.duration && !--this.duration;
	}

	// return true if phase ends (see tick())
	// if tick = 0, will remain 0 and phase will not iterate
	sequentialTick() {
		if (this.tick()) {
			this.nextPhase();
			return true;
		}
	}

	isNew() {
		return this.duration === this.durations[this.phase];
	}

	get() {
		return this.phase;
	}

	// starts at 0, increases to 1
	getRatio() {
		return 1 - this.duration / this.durations[this.phase];
	}
}

module.exports = Phase;

},{"./Number":70}],72:[function(require,module,exports){
const {clamp} = require('./Number');

class Pool {
	constructor(max, incrementRate = 0) {
		this.value = this.max = max;
		this.incrementRate = incrementRate;
	}

	// return true if reached 0 or max
	increment() {
		return this.change(this.incrementRate);
	}

	restore() {
		this.value = this.max;
	}

	// return true if reached 0 or max
	change(amount) {
		this.value = clamp(this.value + amount, 0, this.max);
		return this.value === 0 || this.value === this.max;
	}

	get() {
		return this.value;
	}

	getMax() {
		return this.max;
	}

	getMissing() {
		return this.max - this.value;
	}

	getRatio() {
		return this.value / this.max;
	}

	getMissingRatio() {
		return this.getMissing() / this.max;
	}

	isFull() {
		return this.value === this.max;
	}

	isEmpty() {
		return !this.value;
	}
}

module.exports = Pool;

},{"./Number":70}],73:[function(require,module,exports){
class Trigger {
	constructor(triggerValue) {
		this.triggerValue = triggerValue;
	}

	trigger(value) {
		if (!this.triggered && value === this.triggerValue)
			return this.triggered = true;
	}

	untrigger() {
		this.triggered = false;
	}
}

module.exports = Trigger;

},{}],74:[function(require,module,exports){
const Color = require('./Color');

const Colors = {
	// todo [medium] structure these constants

	// bars
	BAR_SHADING: .25,
	LIFE: Color.fromHexString('#fab9b1'),
	STAMINA: Color.fromHexString('#98d494'),
	ENRAGE: Color.fromHexString('#616600'),

	TARGET_LOCK: Color.from1(.5, .5, .5),
	DAMAGE: Color.from255(255, 0, 0, .4),

	// abilities
	BASIC_ATTACK: Color.fromHexString('#a87676'),
	DASH: Color.fromHexString('#76a876'),
	HEAL: Color.fromHexString('#7676a8'),
	NOT_READY: Color.fromHex('#888'), // todo [high] make visible color on white bg

	Interface: {
		INACTIVE: Color.from1(1, 1, 1),
		HOVER: Color.from1(.95, .95, .95),
		ACTIVE: Color.from1(1, 1, 1)
	},

	Entity: {
		ROCK: Color.fromHexString('#888'),
		PLAYER: Color.fromHexString('#888'),
		MONSTER: Color.fromHexString('#888'),
		PROJECTILE: Color.fromHexString('#888'),
		DUST: Color.fromHexString('#888')
	},

	Ability: {
		NearybyDegen: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .1)
		}
	},

	Star: {
		WHITE: Color.WHITE, // todo [high] white shouldn't be working, & is blue working?
		BLUE: Color.from1(.8, .8, 1)
	},

	Minimap: {
		BACKGROUND: Color.from1(1, 1, 1, .5),
		ROCK: Color.from1(0, 0, 0),
		MONSTER: Color.from1(1, 0, 0),
		BOSS: Color.from1(0, 1, 0),
		PLAYER: Color.from1(0, 0, 1)
	}
};

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .02,
	PLAYER_BAR_X: .5,
	ABILITY_SIZE: .06,
};

module.exports = {UiCs: Colors, UiPs: Positions};

// Notes

// SHIELD_COLOR: Color.from1(.4, .5, .7),
// RESERVE_COLOR: Color.from1(.2, .6, .6),
// EXPERIENCE_COLOR: Color.from1(.9, .6, .1),

// LIFE_EMPTY_COLOR: Color.fromHex(0x4, 0xb, 0xc),
// LIFE_FILL_COLOR: Color.fromHex(0x5, 0xd, 0xf),
// STAMINA_EMPTY_COLOR: Color.fromHex(0xc, 0xc, 0x4),
// STAMINA_FILL_COLOR: Color.fromHex(0xf, 0xf, 0x5),

// const localLife = "#cc4e4e";
// const localStamina = "#ffcc99";
// const localShield = "#6680b3";
// const localReserve = "#339999";
// const localExperience = "#e6991a";

// http://paletton.com/#uid=75C0F0kj+zZ9XRtfuIvo0ulsJqf

// todo [low] find prettier colors

},{"./Color":64}],75:[function(require,module,exports){
const Controller = require('../control/Controller');
const Painter = require('../painter/Painter');
const Logic = require('../logic/Game');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');

const sleep = milli =>
	new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const controller = new Controller(canvas);
const painter = new Painter(canvas);

const logic = new Logic(controller, painter);
// const logic = new GraphicsDemo(controller, painter);
// const logic = new StarfieldDemo(controller, painter);
// const logic = new NoiseDemo(controller, painter);
// const logic = new MapDemo(controller, painter);
// const logic = new InterfaceDemo(controller, painter);

let loop = async () => {
	while (true) {
		painter.clear();
		logic.iterate();
		painter.paint();
		controller.expire();
		await sleep(10);
	}
};

loop();

},{"../control/Controller":8,"../logic/Game":42,"../logic/GraphicsDemo":43,"../logic/InterfaceDemo":44,"../logic/MapDemo":46,"../logic/NoiseDemo":47,"../logic/StarfieldDemo":48,"../painter/Painter":55}]},{},[75])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc2ltcGxleC1ub2lzZS9zaW1wbGV4LW5vaXNlLmpzIiwic3JjL2FiaWxpdGllcy9BYmlsaXR5LmpzIiwic3JjL2FiaWxpdGllcy9EYXNoLmpzIiwic3JjL2FiaWxpdGllcy9IZWFsLmpzIiwic3JjL2FiaWxpdGllcy9MYXNlckF0dGFjay5qcyIsInNyYy9hYmlsaXRpZXMvUHJvamVjdGlsZUF0dGFjay5qcyIsInNyYy9jYW1lcmEvQ2FtZXJhLmpzIiwic3JjL2NvbnRyb2wvQ29udHJvbGxlci5qcyIsInNyYy9jb250cm9sL0tleW1hcHBpbmcuanMiLCJzcmMvY29udHJvbC9TdGF0ZS5qcyIsInNyYy9lbnRpdGllcy9FbnRpdHkuanMiLCJzcmMvZW50aXRpZXMvTGl2aW5nRW50aXR5LmpzIiwic3JjL2VudGl0aWVzL1BsYXllci5qcyIsInNyYy9lbnRpdGllcy9Sb2NrLmpzIiwic3JjL2VudGl0aWVzL2F0dGFjay9MYXNlci5qcyIsInNyYy9lbnRpdGllcy9hdHRhY2svUHJvamVjdGlsZS5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvQ2hhc2UuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL0Rpc3RhbmNlLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9FbmdhZ2UuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL01vZHVsZS5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvTW9kdWxlTWFuYWdlci5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvTmVhcmJ5RGVnZW4uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL1BoYXNlU2V0dGVyLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9SZXN0b3JlLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9TaG90Z3VuLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL0Jvc3MxLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL01vbnN0ZXIuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvU2hvdGd1bldhcnJpb3IuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvVHVycmV0LmpzIiwic3JjL2VudGl0aWVzL3BhcnRpY2xlL0R1c3QuanMiLCJzcmMvZ3JhcGhpY3MvR3JhcGhpY3MuanMiLCJzcmMvZ3JhcGhpY3MvUGF0aENyZWF0b3IuanMiLCJzcmMvZ3JhcGhpY3MvUm9ja0dyYXBoaWMuanMiLCJzcmMvZ3JhcGhpY3MvU3RhclNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvVGVzdFNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvVlNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvV1NoaXAuanMiLCJzcmMvaW50ZXJmYWNlL0J1dHRvbi5qcyIsInNyYy9pbnRlcmZhY2UvSW50ZXJmYWNlLmpzIiwic3JjL2ludGVyc2VjdGlvbi9Cb3VuZHMuanMiLCJzcmMvaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlci5qcyIsInNyYy9sb2dpYy9HYW1lLmpzIiwic3JjL2xvZ2ljL0dyYXBoaWNzRGVtby5qcyIsInNyYy9sb2dpYy9JbnRlcmZhY2VEZW1vLmpzIiwic3JjL2xvZ2ljL0xvZ2ljLmpzIiwic3JjL2xvZ2ljL01hcERlbW8uanMiLCJzcmMvbG9naWMvTm9pc2VEZW1vLmpzIiwic3JjL2xvZ2ljL1N0YXJmaWVsZERlbW8uanMiLCJzcmMvbWFwL01hcC5qcyIsInNyYy9tYXAvTWFwR2VuZXJhdG9yLmpzIiwic3JjL21hcC9NaW5pbWFwLmpzIiwic3JjL3BhaW50ZXIvQmFyLmpzIiwic3JjL3BhaW50ZXIvQmFyQy5qcyIsInNyYy9wYWludGVyL0xpbmUuanMiLCJzcmMvcGFpbnRlci9QYWludGVyLmpzIiwic3JjL3BhaW50ZXIvUGFpbnRlckVsZW1lbnQuanMiLCJzcmMvcGFpbnRlci9QYXRoLmpzIiwic3JjL3BhaW50ZXIvUmVjdC5qcyIsInNyYy9wYWludGVyL1JlY3RDLmpzIiwic3JjL3BhaW50ZXIvVGV4dC5qcyIsInNyYy9zdGFyZmllbGQvU3Rhci5qcyIsInNyYy9zdGFyZmllbGQvU3RhcmZpZWxkLmpzIiwic3JjL3N0YXJmaWVsZC9TdGFyZmllbGROb2lzZS5qcyIsInNyYy91dGlsL0NvbG9yLmpzIiwic3JjL3V0aWwvRGVjYXkuanMiLCJzcmMvdXRpbC9FbnVtLmpzIiwic3JjL3V0aWwvSXRlbS5qcyIsInNyYy91dGlsL0xpbmtlZExpc3QuanMiLCJzcmMvdXRpbC9Ob2lzZS5qcyIsInNyYy91dGlsL051bWJlci5qcyIsInNyYy91dGlsL1BoYXNlLmpzIiwic3JjL3V0aWwvUG9vbC5qcyIsInNyYy91dGlsL1RyaWdnZXIuanMiLCJzcmMvdXRpbC9VaUNvbnN0YW50cy5qcyIsInNyYy92aWV3L0NhbnZhcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6ZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXG4gKiBBIGZhc3QgamF2YXNjcmlwdCBpbXBsZW1lbnRhdGlvbiBvZiBzaW1wbGV4IG5vaXNlIGJ5IEpvbmFzIFdhZ25lclxuXG5CYXNlZCBvbiBhIHNwZWVkLWltcHJvdmVkIHNpbXBsZXggbm9pc2UgYWxnb3JpdGhtIGZvciAyRCwgM0QgYW5kIDREIGluIEphdmEuXG5XaGljaCBpcyBiYXNlZCBvbiBleGFtcGxlIGNvZGUgYnkgU3RlZmFuIEd1c3RhdnNvbiAoc3RlZ3VAaXRuLmxpdS5zZSkuXG5XaXRoIE9wdGltaXNhdGlvbnMgYnkgUGV0ZXIgRWFzdG1hbiAocGVhc3RtYW5AZHJpenpsZS5zdGFuZm9yZC5lZHUpLlxuQmV0dGVyIHJhbmsgb3JkZXJpbmcgbWV0aG9kIGJ5IFN0ZWZhbiBHdXN0YXZzb24gaW4gMjAxMi5cblxuXG4gQ29weXJpZ2h0IChjKSAyMDE4IEpvbmFzIFdhZ25lclxuXG4gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cbiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG4gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gU09GVFdBUkUuXG4gKi9cbihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBGMiA9IDAuNSAqIChNYXRoLnNxcnQoMy4wKSAtIDEuMCk7XG4gIHZhciBHMiA9ICgzLjAgLSBNYXRoLnNxcnQoMy4wKSkgLyA2LjA7XG4gIHZhciBGMyA9IDEuMCAvIDMuMDtcbiAgdmFyIEczID0gMS4wIC8gNi4wO1xuICB2YXIgRjQgPSAoTWF0aC5zcXJ0KDUuMCkgLSAxLjApIC8gNC4wO1xuICB2YXIgRzQgPSAoNS4wIC0gTWF0aC5zcXJ0KDUuMCkpIC8gMjAuMDtcblxuICBmdW5jdGlvbiBTaW1wbGV4Tm9pc2UocmFuZG9tT3JTZWVkKSB7XG4gICAgdmFyIHJhbmRvbTtcbiAgICBpZiAodHlwZW9mIHJhbmRvbU9yU2VlZCA9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByYW5kb20gPSByYW5kb21PclNlZWQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHJhbmRvbU9yU2VlZCkge1xuICAgICAgcmFuZG9tID0gYWxlYShyYW5kb21PclNlZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5kb20gPSBNYXRoLnJhbmRvbTtcbiAgICB9XG4gICAgdGhpcy5wID0gYnVpbGRQZXJtdXRhdGlvblRhYmxlKHJhbmRvbSk7XG4gICAgdGhpcy5wZXJtID0gbmV3IFVpbnQ4QXJyYXkoNTEyKTtcbiAgICB0aGlzLnBlcm1Nb2QxMiA9IG5ldyBVaW50OEFycmF5KDUxMik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCA1MTI7IGkrKykge1xuICAgICAgdGhpcy5wZXJtW2ldID0gdGhpcy5wW2kgJiAyNTVdO1xuICAgICAgdGhpcy5wZXJtTW9kMTJbaV0gPSB0aGlzLnBlcm1baV0gJSAxMjtcbiAgICB9XG5cbiAgfVxuICBTaW1wbGV4Tm9pc2UucHJvdG90eXBlID0ge1xuICAgIGdyYWQzOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAxLCAwLFxuICAgICAgLTEsIDEsIDAsXG4gICAgICAxLCAtMSwgMCxcblxuICAgICAgLTEsIC0xLCAwLFxuICAgICAgMSwgMCwgMSxcbiAgICAgIC0xLCAwLCAxLFxuXG4gICAgICAxLCAwLCAtMSxcbiAgICAgIC0xLCAwLCAtMSxcbiAgICAgIDAsIDEsIDEsXG5cbiAgICAgIDAsIC0xLCAxLFxuICAgICAgMCwgMSwgLTEsXG4gICAgICAwLCAtMSwgLTFdKSxcbiAgICBncmFkNDogbmV3IEZsb2F0MzJBcnJheShbMCwgMSwgMSwgMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAxLCAwLCAxLCAtMSwgLTEsXG4gICAgICAwLCAtMSwgMSwgMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsIDEsIDAsIC0xLCAtMSwgLTEsXG4gICAgICAxLCAwLCAxLCAxLCAxLCAwLCAxLCAtMSwgMSwgMCwgLTEsIDEsIDEsIDAsIC0xLCAtMSxcbiAgICAgIC0xLCAwLCAxLCAxLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSwgMSwgLTEsIDAsIC0xLCAtMSxcbiAgICAgIDEsIDEsIDAsIDEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgMSwgMSwgLTEsIDAsIC0xLFxuICAgICAgLTEsIDEsIDAsIDEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLCAwLCAxLCAtMSwgLTEsIDAsIC0xLFxuICAgICAgMSwgMSwgMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAxLCAwLCAxLCAtMSwgLTEsIDAsXG4gICAgICAtMSwgMSwgMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsIDEsIDAsIC0xLCAtMSwgLTEsIDBdKSxcbiAgICBub2lzZTJEOiBmdW5jdGlvbih4aW4sIHlpbikge1xuICAgICAgdmFyIHBlcm1Nb2QxMiA9IHRoaXMucGVybU1vZDEyO1xuICAgICAgdmFyIHBlcm0gPSB0aGlzLnBlcm07XG4gICAgICB2YXIgZ3JhZDMgPSB0aGlzLmdyYWQzO1xuICAgICAgdmFyIG4wID0gMDsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSB0aHJlZSBjb3JuZXJzXG4gICAgICB2YXIgbjEgPSAwO1xuICAgICAgdmFyIG4yID0gMDtcbiAgICAgIC8vIFNrZXcgdGhlIGlucHV0IHNwYWNlIHRvIGRldGVybWluZSB3aGljaCBzaW1wbGV4IGNlbGwgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHhpbiArIHlpbikgKiBGMjsgLy8gSGFpcnkgZmFjdG9yIGZvciAyRFxuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGopICogRzI7XG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkpIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciB4MCA9IHhpbiAtIFgwOyAvLyBUaGUgeCx5IGRpc3RhbmNlcyBmcm9tIHRoZSBjZWxsIG9yaWdpblxuICAgICAgdmFyIHkwID0geWluIC0gWTA7XG4gICAgICAvLyBGb3IgdGhlIDJEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGFuIGVxdWlsYXRlcmFsIHRyaWFuZ2xlLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgICAgdmFyIGkxLCBqMTsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIChtaWRkbGUpIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGopIGNvb3Jkc1xuICAgICAgaWYgKHgwID4geTApIHtcbiAgICAgICAgaTEgPSAxO1xuICAgICAgICBqMSA9IDA7XG4gICAgICB9IC8vIGxvd2VyIHRyaWFuZ2xlLCBYWSBvcmRlcjogKDAsMCktPigxLDApLT4oMSwxKVxuICAgICAgZWxzZSB7XG4gICAgICAgIGkxID0gMDtcbiAgICAgICAgajEgPSAxO1xuICAgICAgfSAvLyB1cHBlciB0cmlhbmdsZSwgWVggb3JkZXI6ICgwLDApLT4oMCwxKS0+KDEsMSlcbiAgICAgIC8vIEEgc3RlcCBvZiAoMSwwKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKDEtYywtYykgaW4gKHgseSksIGFuZFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDEpIGluIChpLGopIG1lYW5zIGEgc3RlcCBvZiAoLWMsMS1jKSBpbiAoeCx5KSwgd2hlcmVcbiAgICAgIC8vIGMgPSAoMy1zcXJ0KDMpKS82XG4gICAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzI7IC8vIE9mZnNldHMgZm9yIG1pZGRsZSBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzI7XG4gICAgICB2YXIgeDIgPSB4MCAtIDEuMCArIDIuMCAqIEcyOyAvLyBPZmZzZXRzIGZvciBsYXN0IGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gMS4wICsgMi4wICogRzI7XG4gICAgICAvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIHRocmVlIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSB0aHJlZSBjb3JuZXJzXG4gICAgICB2YXIgdDAgPSAwLjUgLSB4MCAqIHgwIC0geTAgKiB5MDtcbiAgICAgIGlmICh0MCA+PSAwKSB7XG4gICAgICAgIHZhciBnaTAgPSBwZXJtTW9kMTJbaWkgKyBwZXJtW2pqXV0gKiAzO1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQzW2dpMF0gKiB4MCArIGdyYWQzW2dpMCArIDFdICogeTApOyAvLyAoeCx5KSBvZiBncmFkMyB1c2VkIGZvciAyRCBncmFkaWVudFxuICAgICAgfVxuICAgICAgdmFyIHQxID0gMC41IC0geDEgKiB4MSAtIHkxICogeTE7XG4gICAgICBpZiAodDEgPj0gMCkge1xuICAgICAgICB2YXIgZ2kxID0gcGVybU1vZDEyW2lpICsgaTEgKyBwZXJtW2pqICsgajFdXSAqIDM7XG4gICAgICAgIHQxICo9IHQxO1xuICAgICAgICBuMSA9IHQxICogdDEgKiAoZ3JhZDNbZ2kxXSAqIHgxICsgZ3JhZDNbZ2kxICsgMV0gKiB5MSk7XG4gICAgICB9XG4gICAgICB2YXIgdDIgPSAwLjUgLSB4MiAqIHgyIC0geTIgKiB5MjtcbiAgICAgIGlmICh0MiA+PSAwKSB7XG4gICAgICAgIHZhciBnaTIgPSBwZXJtTW9kMTJbaWkgKyAxICsgcGVybVtqaiArIDFdXSAqIDM7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDNbZ2kyXSAqIHgyICsgZ3JhZDNbZ2kyICsgMV0gKiB5Mik7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byByZXR1cm4gdmFsdWVzIGluIHRoZSBpbnRlcnZhbCBbLTEsMV0uXG4gICAgICByZXR1cm4gNzAuMCAqIChuMCArIG4xICsgbjIpO1xuICAgIH0sXG4gICAgLy8gM0Qgc2ltcGxleCBub2lzZVxuICAgIG5vaXNlM0Q6IGZ1bmN0aW9uKHhpbiwgeWluLCB6aW4pIHtcbiAgICAgIHZhciBwZXJtTW9kMTIgPSB0aGlzLnBlcm1Nb2QxMjtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQzID0gdGhpcy5ncmFkMztcbiAgICAgIHZhciBuMCwgbjEsIG4yLCBuMzsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSBmb3VyIGNvcm5lcnNcbiAgICAgIC8vIFNrZXcgdGhlIGlucHV0IHNwYWNlIHRvIGRldGVybWluZSB3aGljaCBzaW1wbGV4IGNlbGwgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHhpbiArIHlpbiArIHppbikgKiBGMzsgLy8gVmVyeSBuaWNlIGFuZCBzaW1wbGUgc2tldyBmYWN0b3IgZm9yIDNEXG4gICAgICB2YXIgaSA9IE1hdGguZmxvb3IoeGluICsgcyk7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoeWluICsgcyk7XG4gICAgICB2YXIgayA9IE1hdGguZmxvb3IoemluICsgcyk7XG4gICAgICB2YXIgdCA9IChpICsgaiArIGspICogRzM7XG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkseikgc3BhY2VcbiAgICAgIHZhciBZMCA9IGogLSB0O1xuICAgICAgdmFyIFowID0gayAtIHQ7XG4gICAgICB2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSx6IGRpc3RhbmNlcyBmcm9tIHRoZSBjZWxsIG9yaWdpblxuICAgICAgdmFyIHkwID0geWluIC0gWTA7XG4gICAgICB2YXIgejAgPSB6aW4gLSBaMDtcbiAgICAgIC8vIEZvciB0aGUgM0QgY2FzZSwgdGhlIHNpbXBsZXggc2hhcGUgaXMgYSBzbGlnaHRseSBpcnJlZ3VsYXIgdGV0cmFoZWRyb24uXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggc2ltcGxleCB3ZSBhcmUgaW4uXG4gICAgICB2YXIgaTEsIGoxLCBrMTsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGosaykgY29vcmRzXG4gICAgICB2YXIgaTIsIGoyLCBrMjsgLy8gT2Zmc2V0cyBmb3IgdGhpcmQgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaixrKSBjb29yZHNcbiAgICAgIGlmICh4MCA+PSB5MCkge1xuICAgICAgICBpZiAoeTAgPj0gejApIHtcbiAgICAgICAgICBpMSA9IDE7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMDtcbiAgICAgICAgfSAvLyBYIFkgWiBvcmRlclxuICAgICAgICBlbHNlIGlmICh4MCA+PSB6MCkge1xuICAgICAgICAgIGkxID0gMTtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDA7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFggWiBZIG9yZGVyXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAxO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDA7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFogWCBZIG9yZGVyXG4gICAgICB9XG4gICAgICBlbHNlIHsgLy8geDA8eTBcbiAgICAgICAgaWYgKHkwIDwgejApIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMTtcbiAgICAgICAgICBpMiA9IDA7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBaIFkgWCBvcmRlclxuICAgICAgICBlbHNlIGlmICh4MCA8IHowKSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMTtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAwO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWSBaIFggb3JkZXJcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMTtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDA7XG4gICAgICAgIH0gLy8gWSBYIFogb3JkZXJcbiAgICAgIH1cbiAgICAgIC8vIEEgc3RlcCBvZiAoMSwwLDApIGluIChpLGosaykgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMsLWMpIGluICh4LHkseiksXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMSwwKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoLWMsMS1jLC1jKSBpbiAoeCx5LHopLCBhbmRcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwwLDEpIGluIChpLGosaykgbWVhbnMgYSBzdGVwIG9mICgtYywtYywxLWMpIGluICh4LHkseiksIHdoZXJlXG4gICAgICAvLyBjID0gMS82LlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEczOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzM7XG4gICAgICB2YXIgejEgPSB6MCAtIGsxICsgRzM7XG4gICAgICB2YXIgeDIgPSB4MCAtIGkyICsgMi4wICogRzM7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkyID0geTAgLSBqMiArIDIuMCAqIEczO1xuICAgICAgdmFyIHoyID0gejAgLSBrMiArIDIuMCAqIEczO1xuICAgICAgdmFyIHgzID0geDAgLSAxLjAgKyAzLjAgKiBHMzsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MyA9IHkwIC0gMS4wICsgMy4wICogRzM7XG4gICAgICB2YXIgejMgPSB6MCAtIDEuMCArIDMuMCAqIEczO1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSBmb3VyIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICB2YXIga2sgPSBrICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgZm91ciBjb3JuZXJzXG4gICAgICB2YXIgdDAgPSAwLjYgLSB4MCAqIHgwIC0geTAgKiB5MCAtIHowICogejA7XG4gICAgICBpZiAodDAgPCAwKSBuMCA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kwID0gcGVybU1vZDEyW2lpICsgcGVybVtqaiArIHBlcm1ba2tdXV0gKiAzO1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQzW2dpMF0gKiB4MCArIGdyYWQzW2dpMCArIDFdICogeTAgKyBncmFkM1tnaTAgKyAyXSAqIHowKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNiAtIHgxICogeDEgLSB5MSAqIHkxIC0gejEgKiB6MTtcbiAgICAgIGlmICh0MSA8IDApIG4xID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTEgPSBwZXJtTW9kMTJbaWkgKyBpMSArIHBlcm1bamogKyBqMSArIHBlcm1ba2sgKyBrMV1dXSAqIDM7XG4gICAgICAgIHQxICo9IHQxO1xuICAgICAgICBuMSA9IHQxICogdDEgKiAoZ3JhZDNbZ2kxXSAqIHgxICsgZ3JhZDNbZ2kxICsgMV0gKiB5MSArIGdyYWQzW2dpMSArIDJdICogejEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC42IC0geDIgKiB4MiAtIHkyICogeTIgLSB6MiAqIHoyO1xuICAgICAgaWYgKHQyIDwgMCkgbjIgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMiA9IHBlcm1Nb2QxMltpaSArIGkyICsgcGVybVtqaiArIGoyICsgcGVybVtrayArIGsyXV1dICogMztcbiAgICAgICAgdDIgKj0gdDI7XG4gICAgICAgIG4yID0gdDIgKiB0MiAqIChncmFkM1tnaTJdICogeDIgKyBncmFkM1tnaTIgKyAxXSAqIHkyICsgZ3JhZDNbZ2kyICsgMl0gKiB6Mik7XG4gICAgICB9XG4gICAgICB2YXIgdDMgPSAwLjYgLSB4MyAqIHgzIC0geTMgKiB5MyAtIHozICogejM7XG4gICAgICBpZiAodDMgPCAwKSBuMyA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kzID0gcGVybU1vZDEyW2lpICsgMSArIHBlcm1bamogKyAxICsgcGVybVtrayArIDFdXV0gKiAzO1xuICAgICAgICB0MyAqPSB0MztcbiAgICAgICAgbjMgPSB0MyAqIHQzICogKGdyYWQzW2dpM10gKiB4MyArIGdyYWQzW2dpMyArIDFdICogeTMgKyBncmFkM1tnaTMgKyAyXSAqIHozKTtcbiAgICAgIH1cbiAgICAgIC8vIEFkZCBjb250cmlidXRpb25zIGZyb20gZWFjaCBjb3JuZXIgdG8gZ2V0IHRoZSBmaW5hbCBub2lzZSB2YWx1ZS5cbiAgICAgIC8vIFRoZSByZXN1bHQgaXMgc2NhbGVkIHRvIHN0YXkganVzdCBpbnNpZGUgWy0xLDFdXG4gICAgICByZXR1cm4gMzIuMCAqIChuMCArIG4xICsgbjIgKyBuMyk7XG4gICAgfSxcbiAgICAvLyA0RCBzaW1wbGV4IG5vaXNlLCBiZXR0ZXIgc2ltcGxleCByYW5rIG9yZGVyaW5nIG1ldGhvZCAyMDEyLTAzLTA5XG4gICAgbm9pc2U0RDogZnVuY3Rpb24oeCwgeSwgeiwgdykge1xuICAgICAgdmFyIHBlcm0gPSB0aGlzLnBlcm07XG4gICAgICB2YXIgZ3JhZDQgPSB0aGlzLmdyYWQ0O1xuXG4gICAgICB2YXIgbjAsIG4xLCBuMiwgbjMsIG40OyAvLyBOb2lzZSBjb250cmlidXRpb25zIGZyb20gdGhlIGZpdmUgY29ybmVyc1xuICAgICAgLy8gU2tldyB0aGUgKHgseSx6LHcpIHNwYWNlIHRvIGRldGVybWluZSB3aGljaCBjZWxsIG9mIDI0IHNpbXBsaWNlcyB3ZSdyZSBpblxuICAgICAgdmFyIHMgPSAoeCArIHkgKyB6ICsgdykgKiBGNDsgLy8gRmFjdG9yIGZvciA0RCBza2V3aW5nXG4gICAgICB2YXIgaSA9IE1hdGguZmxvb3IoeCArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHkgKyBzKTtcbiAgICAgIHZhciBrID0gTWF0aC5mbG9vcih6ICsgcyk7XG4gICAgICB2YXIgbCA9IE1hdGguZmxvb3IodyArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGogKyBrICsgbCkgKiBHNDsgLy8gRmFjdG9yIGZvciA0RCB1bnNrZXdpbmdcbiAgICAgIHZhciBYMCA9IGkgLSB0OyAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSx6LHcpIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciBaMCA9IGsgLSB0O1xuICAgICAgdmFyIFcwID0gbCAtIHQ7XG4gICAgICB2YXIgeDAgPSB4IC0gWDA7IC8vIFRoZSB4LHkseix3IGRpc3RhbmNlcyBmcm9tIHRoZSBjZWxsIG9yaWdpblxuICAgICAgdmFyIHkwID0geSAtIFkwO1xuICAgICAgdmFyIHowID0geiAtIFowO1xuICAgICAgdmFyIHcwID0gdyAtIFcwO1xuICAgICAgLy8gRm9yIHRoZSA0RCBjYXNlLCB0aGUgc2ltcGxleCBpcyBhIDREIHNoYXBlIEkgd29uJ3QgZXZlbiB0cnkgdG8gZGVzY3JpYmUuXG4gICAgICAvLyBUbyBmaW5kIG91dCB3aGljaCBvZiB0aGUgMjQgcG9zc2libGUgc2ltcGxpY2VzIHdlJ3JlIGluLCB3ZSBuZWVkIHRvXG4gICAgICAvLyBkZXRlcm1pbmUgdGhlIG1hZ25pdHVkZSBvcmRlcmluZyBvZiB4MCwgeTAsIHowIGFuZCB3MC5cbiAgICAgIC8vIFNpeCBwYWlyLXdpc2UgY29tcGFyaXNvbnMgYXJlIHBlcmZvcm1lZCBiZXR3ZWVuIGVhY2ggcG9zc2libGUgcGFpclxuICAgICAgLy8gb2YgdGhlIGZvdXIgY29vcmRpbmF0ZXMsIGFuZCB0aGUgcmVzdWx0cyBhcmUgdXNlZCB0byByYW5rIHRoZSBudW1iZXJzLlxuICAgICAgdmFyIHJhbmt4ID0gMDtcbiAgICAgIHZhciByYW5reSA9IDA7XG4gICAgICB2YXIgcmFua3ogPSAwO1xuICAgICAgdmFyIHJhbmt3ID0gMDtcbiAgICAgIGlmICh4MCA+IHkwKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5reSsrO1xuICAgICAgaWYgKHgwID4gejApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt6Kys7XG4gICAgICBpZiAoeDAgPiB3MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3crKztcbiAgICAgIGlmICh5MCA+IHowKSByYW5reSsrO1xuICAgICAgZWxzZSByYW5reisrO1xuICAgICAgaWYgKHkwID4gdzApIHJhbmt5Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICBpZiAoejAgPiB3MCkgcmFua3orKztcbiAgICAgIGVsc2UgcmFua3crKztcbiAgICAgIHZhciBpMSwgajEsIGsxLCBsMTsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIHNlY29uZCBzaW1wbGV4IGNvcm5lclxuICAgICAgdmFyIGkyLCBqMiwgazIsIGwyOyAvLyBUaGUgaW50ZWdlciBvZmZzZXRzIGZvciB0aGUgdGhpcmQgc2ltcGxleCBjb3JuZXJcbiAgICAgIHZhciBpMywgajMsIGszLCBsMzsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIGZvdXJ0aCBzaW1wbGV4IGNvcm5lclxuICAgICAgLy8gc2ltcGxleFtjXSBpcyBhIDQtdmVjdG9yIHdpdGggdGhlIG51bWJlcnMgMCwgMSwgMiBhbmQgMyBpbiBzb21lIG9yZGVyLlxuICAgICAgLy8gTWFueSB2YWx1ZXMgb2YgYyB3aWxsIG5ldmVyIG9jY3VyLCBzaW5jZSBlLmcuIHg+eT56PncgbWFrZXMgeDx6LCB5PHcgYW5kIHg8d1xuICAgICAgLy8gaW1wb3NzaWJsZS4gT25seSB0aGUgMjQgaW5kaWNlcyB3aGljaCBoYXZlIG5vbi16ZXJvIGVudHJpZXMgbWFrZSBhbnkgc2Vuc2UuXG4gICAgICAvLyBXZSB1c2UgYSB0aHJlc2hvbGRpbmcgdG8gc2V0IHRoZSBjb29yZGluYXRlcyBpbiB0dXJuIGZyb20gdGhlIGxhcmdlc3QgbWFnbml0dWRlLlxuICAgICAgLy8gUmFuayAzIGRlbm90ZXMgdGhlIGxhcmdlc3QgY29vcmRpbmF0ZS5cbiAgICAgIGkxID0gcmFua3ggPj0gMyA/IDEgOiAwO1xuICAgICAgajEgPSByYW5reSA+PSAzID8gMSA6IDA7XG4gICAgICBrMSA9IHJhbmt6ID49IDMgPyAxIDogMDtcbiAgICAgIGwxID0gcmFua3cgPj0gMyA/IDEgOiAwO1xuICAgICAgLy8gUmFuayAyIGRlbm90ZXMgdGhlIHNlY29uZCBsYXJnZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMiA9IHJhbmt4ID49IDIgPyAxIDogMDtcbiAgICAgIGoyID0gcmFua3kgPj0gMiA/IDEgOiAwO1xuICAgICAgazIgPSByYW5reiA+PSAyID8gMSA6IDA7XG4gICAgICBsMiA9IHJhbmt3ID49IDIgPyAxIDogMDtcbiAgICAgIC8vIFJhbmsgMSBkZW5vdGVzIHRoZSBzZWNvbmQgc21hbGxlc3QgY29vcmRpbmF0ZS5cbiAgICAgIGkzID0gcmFua3ggPj0gMSA/IDEgOiAwO1xuICAgICAgajMgPSByYW5reSA+PSAxID8gMSA6IDA7XG4gICAgICBrMyA9IHJhbmt6ID49IDEgPyAxIDogMDtcbiAgICAgIGwzID0gcmFua3cgPj0gMSA/IDEgOiAwO1xuICAgICAgLy8gVGhlIGZpZnRoIGNvcm5lciBoYXMgYWxsIGNvb3JkaW5hdGUgb2Zmc2V0cyA9IDEsIHNvIG5vIG5lZWQgdG8gY29tcHV0ZSB0aGF0LlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEc0OyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5MSA9IHkwIC0gajEgKyBHNDtcbiAgICAgIHZhciB6MSA9IHowIC0gazEgKyBHNDtcbiAgICAgIHZhciB3MSA9IHcwIC0gbDEgKyBHNDtcbiAgICAgIHZhciB4MiA9IHgwIC0gaTIgKyAyLjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgdGhpcmQgY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gajIgKyAyLjAgKiBHNDtcbiAgICAgIHZhciB6MiA9IHowIC0gazIgKyAyLjAgKiBHNDtcbiAgICAgIHZhciB3MiA9IHcwIC0gbDIgKyAyLjAgKiBHNDtcbiAgICAgIHZhciB4MyA9IHgwIC0gaTMgKyAzLjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgZm91cnRoIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTMgPSB5MCAtIGozICsgMy4wICogRzQ7XG4gICAgICB2YXIgejMgPSB6MCAtIGszICsgMy4wICogRzQ7XG4gICAgICB2YXIgdzMgPSB3MCAtIGwzICsgMy4wICogRzQ7XG4gICAgICB2YXIgeDQgPSB4MCAtIDEuMCArIDQuMCAqIEc0OyAvLyBPZmZzZXRzIGZvciBsYXN0IGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTQgPSB5MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgdmFyIHo0ID0gejAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIHZhciB3NCA9IHcwIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICAvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIGZpdmUgc2ltcGxleCBjb3JuZXJzXG4gICAgICB2YXIgaWkgPSBpICYgMjU1O1xuICAgICAgdmFyIGpqID0gaiAmIDI1NTtcbiAgICAgIHZhciBrayA9IGsgJiAyNTU7XG4gICAgICB2YXIgbGwgPSBsICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgZml2ZSBjb3JuZXJzXG4gICAgICB2YXIgdDAgPSAwLjYgLSB4MCAqIHgwIC0geTAgKiB5MCAtIHowICogejAgLSB3MCAqIHcwO1xuICAgICAgaWYgKHQwIDwgMCkgbjAgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMCA9IChwZXJtW2lpICsgcGVybVtqaiArIHBlcm1ba2sgKyBwZXJtW2xsXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQwICo9IHQwO1xuICAgICAgICBuMCA9IHQwICogdDAgKiAoZ3JhZDRbZ2kwXSAqIHgwICsgZ3JhZDRbZ2kwICsgMV0gKiB5MCArIGdyYWQ0W2dpMCArIDJdICogejAgKyBncmFkNFtnaTAgKyAzXSAqIHcwKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNiAtIHgxICogeDEgLSB5MSAqIHkxIC0gejEgKiB6MSAtIHcxICogdzE7XG4gICAgICBpZiAodDEgPCAwKSBuMSA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kxID0gKHBlcm1baWkgKyBpMSArIHBlcm1bamogKyBqMSArIHBlcm1ba2sgKyBrMSArIHBlcm1bbGwgKyBsMV1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQ0W2dpMV0gKiB4MSArIGdyYWQ0W2dpMSArIDFdICogeTEgKyBncmFkNFtnaTEgKyAyXSAqIHoxICsgZ3JhZDRbZ2kxICsgM10gKiB3MSk7XG4gICAgICB9XG4gICAgICB2YXIgdDIgPSAwLjYgLSB4MiAqIHgyIC0geTIgKiB5MiAtIHoyICogejIgLSB3MiAqIHcyO1xuICAgICAgaWYgKHQyIDwgMCkgbjIgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMiA9IChwZXJtW2lpICsgaTIgKyBwZXJtW2pqICsgajIgKyBwZXJtW2trICsgazIgKyBwZXJtW2xsICsgbDJdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDIgKj0gdDI7XG4gICAgICAgIG4yID0gdDIgKiB0MiAqIChncmFkNFtnaTJdICogeDIgKyBncmFkNFtnaTIgKyAxXSAqIHkyICsgZ3JhZDRbZ2kyICsgMl0gKiB6MiArIGdyYWQ0W2dpMiArIDNdICogdzIpO1xuICAgICAgfVxuICAgICAgdmFyIHQzID0gMC42IC0geDMgKiB4MyAtIHkzICogeTMgLSB6MyAqIHozIC0gdzMgKiB3MztcbiAgICAgIGlmICh0MyA8IDApIG4zID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTMgPSAocGVybVtpaSArIGkzICsgcGVybVtqaiArIGozICsgcGVybVtrayArIGszICsgcGVybVtsbCArIGwzXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQzICo9IHQzO1xuICAgICAgICBuMyA9IHQzICogdDMgKiAoZ3JhZDRbZ2kzXSAqIHgzICsgZ3JhZDRbZ2kzICsgMV0gKiB5MyArIGdyYWQ0W2dpMyArIDJdICogejMgKyBncmFkNFtnaTMgKyAzXSAqIHczKTtcbiAgICAgIH1cbiAgICAgIHZhciB0NCA9IDAuNiAtIHg0ICogeDQgLSB5NCAqIHk0IC0gejQgKiB6NCAtIHc0ICogdzQ7XG4gICAgICBpZiAodDQgPCAwKSBuNCA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2k0ID0gKHBlcm1baWkgKyAxICsgcGVybVtqaiArIDEgKyBwZXJtW2trICsgMSArIHBlcm1bbGwgKyAxXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQ0ICo9IHQ0O1xuICAgICAgICBuNCA9IHQ0ICogdDQgKiAoZ3JhZDRbZ2k0XSAqIHg0ICsgZ3JhZDRbZ2k0ICsgMV0gKiB5NCArIGdyYWQ0W2dpNCArIDJdICogejQgKyBncmFkNFtnaTQgKyAzXSAqIHc0KTtcbiAgICAgIH1cbiAgICAgIC8vIFN1bSB1cCBhbmQgc2NhbGUgdGhlIHJlc3VsdCB0byBjb3ZlciB0aGUgcmFuZ2UgWy0xLDFdXG4gICAgICByZXR1cm4gMjcuMCAqIChuMCArIG4xICsgbjIgKyBuMyArIG40KTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gYnVpbGRQZXJtdXRhdGlvblRhYmxlKHJhbmRvbSkge1xuICAgIHZhciBpO1xuICAgIHZhciBwID0gbmV3IFVpbnQ4QXJyYXkoMjU2KTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgMjU2OyBpKyspIHtcbiAgICAgIHBbaV0gPSBpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgMjU1OyBpKyspIHtcbiAgICAgIHZhciByID0gaSArIH5+KHJhbmRvbSgpICogKDI1NiAtIGkpKTtcbiAgICAgIHZhciBhdXggPSBwW2ldO1xuICAgICAgcFtpXSA9IHBbcl07XG4gICAgICBwW3JdID0gYXV4O1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfVxuICBTaW1wbGV4Tm9pc2UuX2J1aWxkUGVybXV0YXRpb25UYWJsZSA9IGJ1aWxkUGVybXV0YXRpb25UYWJsZTtcblxuICBmdW5jdGlvbiBhbGVhKCkge1xuICAgIC8vIEpvaGFubmVzIEJhYWfDuGUgPGJhYWdvZUBiYWFnb2UuY29tPiwgMjAxMFxuICAgIHZhciBzMCA9IDA7XG4gICAgdmFyIHMxID0gMDtcbiAgICB2YXIgczIgPSAwO1xuICAgIHZhciBjID0gMTtcblxuICAgIHZhciBtYXNoID0gbWFzaGVyKCk7XG4gICAgczAgPSBtYXNoKCcgJyk7XG4gICAgczEgPSBtYXNoKCcgJyk7XG4gICAgczIgPSBtYXNoKCcgJyk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgczAgLT0gbWFzaChhcmd1bWVudHNbaV0pO1xuICAgICAgaWYgKHMwIDwgMCkge1xuICAgICAgICBzMCArPSAxO1xuICAgICAgfVxuICAgICAgczEgLT0gbWFzaChhcmd1bWVudHNbaV0pO1xuICAgICAgaWYgKHMxIDwgMCkge1xuICAgICAgICBzMSArPSAxO1xuICAgICAgfVxuICAgICAgczIgLT0gbWFzaChhcmd1bWVudHNbaV0pO1xuICAgICAgaWYgKHMyIDwgMCkge1xuICAgICAgICBzMiArPSAxO1xuICAgICAgfVxuICAgIH1cbiAgICBtYXNoID0gbnVsbDtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgdCA9IDIwOTE2MzkgKiBzMCArIGMgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICAgICAgczAgPSBzMTtcbiAgICAgIHMxID0gczI7XG4gICAgICByZXR1cm4gczIgPSB0IC0gKGMgPSB0IHwgMCk7XG4gICAgfTtcbiAgfVxuICBmdW5jdGlvbiBtYXNoZXIoKSB7XG4gICAgdmFyIG4gPSAweGVmYzgyNDlkO1xuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBkYXRhID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG4gKz0gZGF0YS5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB2YXIgaCA9IDAuMDI1MTk2MDMyODI0MTY5MzggKiBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBoICo9IG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIG4gKz0gaCAqIDB4MTAwMDAwMDAwOyAvLyAyXjMyXG4gICAgICB9XG4gICAgICByZXR1cm4gKG4gPj4+IDApICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICB9O1xuICB9XG5cbiAgLy8gYW1kXG4gIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSBkZWZpbmUoZnVuY3Rpb24oKSB7cmV0dXJuIFNpbXBsZXhOb2lzZTt9KTtcbiAgLy8gY29tbW9uIGpzXG4gIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIGV4cG9ydHMuU2ltcGxleE5vaXNlID0gU2ltcGxleE5vaXNlO1xuICAvLyBicm93c2VyXG4gIGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB3aW5kb3cuU2ltcGxleE5vaXNlID0gU2ltcGxleE5vaXNlO1xuICAvLyBub2RlanNcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTaW1wbGV4Tm9pc2U7XG4gIH1cblxufSkoKTtcbiIsImNvbnN0IFBvb2wgPSByZXF1aXJlKCcuLi91dGlsL1Bvb2wnKTtcbmNvbnN0IHtVaUNzLCBVaVBzfSA9IHJlcXVpcmUoJy4uL3V0aWwvVWlDb25zdGFudHMnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcblxuY2xhc3MgQWJpbGl0eSB7XG5cdGNvbnN0cnVjdG9yKGNvb2xkb3duLCBjaGFyZ2VzLCBzdGFtaW5hLCByZXBlYXRhYmxlLCB1aUluZGV4LCBwYWludFVpQ29sb3IpIHtcblx0XHR0aGlzLmNvb2xkb3duID0gbmV3IFBvb2woY29vbGRvd24sIC0xKTtcblx0XHR0aGlzLmNoYXJnZXMgPSBuZXcgUG9vbChjaGFyZ2VzLCAxKTtcblx0XHR0aGlzLnN0YW1pbmEgPSBzdGFtaW5hO1xuXHRcdHRoaXMucmVwZWF0YWJsZSA9IHJlcGVhdGFibGU7XG5cdFx0dGhpcy51aUluZGV4ID0gdWlJbmRleDtcblx0XHR0aGlzLnBhaW50VWlDb2xvciA9IHBhaW50VWlDb2xvcjtcblx0fVxuXG5cdHNhZmVBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGlmICh0aGlzLnJlYWR5KVxuXHRcdFx0aWYgKHRoaXMuYWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpKSB7XG5cdFx0XHRcdHRoaXMuY2hhcmdlcy5jaGFuZ2UoLTEpO1xuXHRcdFx0XHRwbGF5ZXIuY29uc3VtZVN0YW1pbmEodGhpcy5zdGFtaW5hKTtcblx0XHRcdH1cblx0XHR0aGlzLnJlcGVhdGluZyA9IDI7XG5cdH1cblxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHR9XG5cblx0cmVmcmVzaChwbGF5ZXIpIHtcblx0XHRpZiAoIXRoaXMuY2hhcmdlcy5pc0Z1bGwoKSAmJiB0aGlzLmNvb2xkb3duLmluY3JlbWVudCgpKSB7XG5cdFx0XHR0aGlzLmNoYXJnZXMuaW5jcmVtZW50KCk7XG5cdFx0XHR0aGlzLmNvb2xkb3duLnJlc3RvcmUoKTtcblx0XHR9XG5cdFx0dGhpcy5yZXBlYXRpbmcgJiYgdGhpcy5yZXBlYXRpbmctLTtcblx0XHR0aGlzLnJlYWR5ID0gIXRoaXMuY2hhcmdlcy5pc0VtcHR5KCkgJiYgcGxheWVyLnN1ZmZpY2llbnRTdGFtaW5hKHRoaXMuc3RhbWluYSkgJiYgKHRoaXMucmVwZWF0YWJsZSB8fCAhdGhpcy5yZXBlYXRpbmcpXG5cdH1cblxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdC8vIGJhY2tncm91bmRcblx0XHRjb25zdCBTSVpFX1dJVEhfTUFSR0lOID0gVWlQcy5BQklMSVRZX1NJWkUgKyBVaVBzLk1BUkdJTjtcblx0XHRjb25zdCBMRUZUID0gVWlQcy5NQVJHSU4gKyB0aGlzLnVpSW5kZXggKiBTSVpFX1dJVEhfTUFSR0lOLCBUT1AgPSAxIC0gU0laRV9XSVRIX01BUkdJTjtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdChMRUZULCBUT1AsIFVpUHMuQUJJTElUWV9TSVpFLCBVaVBzLkFCSUxJVFlfU0laRSwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLnBhaW50VWlDb2xvci5nZXRTaGFkZSgpfSkpO1xuXG5cdFx0Ly8gZm9yZWdyb3VuZCBmb3IgY3VycmVudCBjaGFyZ2VzXG5cdFx0Y29uc3QgUk9XX0hFSUdIVCA9IFVpUHMuQUJJTElUWV9TSVpFIC8gdGhpcy5jaGFyZ2VzLmdldE1heCgpO1xuXHRcdGNvbnN0IEhFSUdIVCA9IHRoaXMuY2hhcmdlcy5nZXQoKSAqIFJPV19IRUlHSFQ7XG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QoTEVGVCwgVE9QICsgVWlQcy5BQklMSVRZX1NJWkUgLSBIRUlHSFQsIFVpUHMuQUJJTElUWV9TSVpFLCBIRUlHSFQsIHtmaWxsOiB0cnVlLCBjb2xvcjogdGhpcy5wYWludFVpQ29sb3IuZ2V0KCl9KSk7XG5cblx0XHQvLyBoeWJyaWQgZm9yIGN1cnJlbnQgY29vbGRvd25cblx0XHRpZiAoIXRoaXMuY29vbGRvd24uaXNGdWxsKCkpIHtcblx0XHRcdGxldCBzaGFkZSA9IHRoaXMuY29vbGRvd24uZ2V0UmF0aW8oKTtcblx0XHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCArIFVpUHMuQUJJTElUWV9TSVpFIC0gSEVJR0hUIC0gUk9XX0hFSUdIVCwgVWlQcy5BQklMSVRZX1NJWkUsIFJPV19IRUlHSFQsIHtmaWxsOiB0cnVlLCBjb2xvcjogdGhpcy5wYWludFVpQ29sb3IuZ2V0U2hhZGUoc2hhZGUpfSkpO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy5yZWFkeSlcblx0XHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCwgVWlQcy5BQklMSVRZX1NJWkUsIFVpUHMuQUJJTElUWV9TSVpFLCB7Y29sb3I6IFVpQ3MuTk9UX1JFQURZLmdldCgpLCB0aGlja25lc3M6IDR9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBYmlsaXR5O1xuIiwiY29uc3QgQWJpbGl0eSA9IHJlcXVpcmUoJy4vQWJpbGl0eScpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3Qge2Jvb2xlYW5BcnJheX0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuXG5jbGFzcyBEYXNoIGV4dGVuZHMgQWJpbGl0eSB7XG5cdGNvbnN0cnVjdG9yKHBhaW50VWlDb2x1bW4pIHtcblx0XHRzdXBlcigxMjAsIDMsIDEwLCBmYWxzZSwgcGFpbnRVaUNvbHVtbiwgVWlDcy5EQVNIKTtcblx0fVxuXG5cdGFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyKSB7XG5cdFx0aWYgKCFib29sZWFuQXJyYXkocGxheWVyLmN1cnJlbnRNb3ZlKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRwbGF5ZXIuc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCAuLi5wbGF5ZXIuY3VycmVudE1vdmUsIC4xLCB0cnVlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhc2g7XG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNsYXNzIERhc2ggZXh0ZW5kcyBBYmlsaXR5IHtcblx0Y29uc3RydWN0b3IocGFpbnRVaUNvbHVtbikge1xuXHRcdHN1cGVyKDcyMCwgMSwgMzAsIGZhbHNlLCBwYWludFVpQ29sdW1uLCBVaUNzLkhFQUwpO1xuXHR9XG5cblx0YWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAocGxheWVyLmhlYWx0aC5pc0Z1bGwoKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRwbGF5ZXIuY2hhbmdlSGVhbHRoKC4xKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhc2g7XG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBMYXNlciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL2F0dGFjay9MYXNlcicpO1xuXG5jbGFzcyBMYXNlckF0dGFjayBleHRlbmRzIEFiaWxpdHkge1xuXHRjb25zdHJ1Y3RvcihwYWludFVpQ29sdW1uKSB7XG5cdFx0c3VwZXIoMywgMTUsIC42LCB0cnVlLCBwYWludFVpQ29sdW1uLCBVaUNzLkJBU0lDX0FUVEFDSyk7XG5cdH1cblxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGNvbnN0IFJBTkdFID0gLjE1LCBTUFJFQUQgPSAuMDUsIFRJTUUgPSAxMCwgREFNQUdFID0gLjAwMTtcblx0XHRsZXQgZGlyZWN0diA9IHNldE1hZ25pdHVkZShkaXJlY3QueCwgZGlyZWN0LnksIFJBTkdFKTtcblx0XHRsZXQgcmFuZHYgPSByYW5kVmVjdG9yKFJBTkdFICogU1BSRUFEKTtcblx0XHRsZXQgbGFzZXIgPSBuZXcgTGFzZXIob3JpZ2luLngsIG9yaWdpbi55LCBkaXJlY3R2LnggKyByYW5kdlswXSwgZGlyZWN0di55ICsgcmFuZHZbMV0sIFRJTUUsIERBTUFHRSwgdHJ1ZSk7XG5cdFx0bWFwLmFkZFByb2plY3RpbGUobGFzZXIpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGFzZXJBdHRhY2s7XG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL1Byb2plY3RpbGUnKTtcblxuY2xhc3MgUHJvamVjdGlsZUF0dGFjayBleHRlbmRzIEFiaWxpdHkge1xuXHRjb25zdHJ1Y3RvcihwYWludFVpQ29sdW1uKSB7XG5cdFx0c3VwZXIoMywgMTUsIC42LCB0cnVlLCBwYWludFVpQ29sdW1uLCBVaUNzLkJBU0lDX0FUVEFDSyk7XG5cdH1cblxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGNvbnN0IFZFTE9DSVRZID0gLjAxNSwgU1BSRUFEID0gLjEsIFNJWkUgPSAuMDEsIFRJTUUgPSAxMDAsIERBTUFHRSA9IC4wMDE7XG5cdFx0bGV0IGRpcmVjdHYgPSBzZXRNYWduaXR1ZGUoZGlyZWN0LngsIGRpcmVjdC55LCBWRUxPQ0lUWSk7XG5cdFx0bGV0IHJhbmR2ID0gcmFuZFZlY3RvcihWRUxPQ0lUWSAqIFNQUkVBRCk7XG5cdFx0bGV0IHByb2plY3RpbGUgPSBuZXcgUHJvamVjdGlsZShvcmlnaW4ueCwgb3JpZ2luLnksIFNJWkUsIFNJWkUsIGRpcmVjdHYueCArIHJhbmR2WzBdLCBkaXJlY3R2LnkgKyByYW5kdlsxXSwgVElNRSwgREFNQUdFLCB0cnVlKTtcblx0XHRtYXAuYWRkUHJvamVjdGlsZShwcm9qZWN0aWxlKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2plY3RpbGVBdHRhY2s7XG4iLCJjb25zdCB7Y2xhbXAsIGF2Z30gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuY29uc3QgS2V5bWFwcGluZyA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvS2V5bWFwcGluZycpO1xuXG5jbGFzcyBDYW1lcmEge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB6ID0gMykge1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLmVuZFogPSB0aGlzLnogPSB6O1xuXHRcdHRoaXMuczAgPSB0aGlzLmNhbGNTKDApO1xuXHR9XG5cblx0c3RhdGljIGNyZWF0ZUZvclJlZ2lvbihmcm9tU2NhbGUsIHRvTGVmdCwgdG9Ub3AsIHRvU2NhbGUpIHtcblx0XHRsZXQgaW52U2NhbGUgPSBmcm9tU2NhbGUgLyB0b1NjYWxlO1xuXHRcdHJldHVybiBuZXcgQ2FtZXJhKCguNSAtIHRvTGVmdCkgKiBpbnZTY2FsZSwgKC41IC0gdG9Ub3ApICogaW52U2NhbGUsIGludlNjYWxlKTtcblx0fVxuXG5cdC8vIGNlbnRlciByYW5nZSBbWzAsIHdpZHRoXSwgWzAsIGhlaWdodF1dXG5cdC8vIGFkanVzdG1lbnQgcmFuZ2UgW1swLCAxXSwgWzAsIDFdXVxuXHRtb3ZlKGNlbnRlciwgYWRqdXN0bWVudCkge1xuXHRcdGNvbnN0IEFESlVTVE1FTlRfV0VJR0hUID0gLjUsIEZJTFRFUl9XRUlHSFQgPSAuOTM7XG5cdFx0bGV0IHggPSBjZW50ZXIueCArIChhZGp1c3RtZW50LnggLSAuNSkgKiBBREpVU1RNRU5UX1dFSUdIVDtcblx0XHRsZXQgeSA9IGNlbnRlci55ICsgKGFkanVzdG1lbnQueSAtIC41KSAqIEFESlVTVE1FTlRfV0VJR0hUO1xuXHRcdHRoaXMueCA9IGF2Zyh0aGlzLngsIHgsIEZJTFRFUl9XRUlHSFQpO1xuXHRcdHRoaXMueSA9IGF2Zyh0aGlzLnksIHksIEZJTFRFUl9XRUlHSFQpO1xuXHR9XG5cblx0em9vbShjb250cm9sbGVyLCBrZXltYXBwaW5nKSB7XG5cdFx0Y29uc3QgWk9PTV9SQVRFID0gLjIsIE1JTl9aID0gMSwgTUFYX1ogPSAxMCwgRklMVEVSX1dFSUdIVCA9IC45Mztcblx0XHRsZXQgZHogPSBrZXltYXBwaW5nLmdldEtleVN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuS2V5cy5aT09NX09VVCkuYWN0aXZlIC0ga2V5bWFwcGluZy5nZXRLZXlTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLktleXMuWk9PTV9JTikuYWN0aXZlO1xuXHRcdGlmIChkeilcblx0XHRcdHRoaXMuZW5kWiA9IGNsYW1wKHRoaXMuZW5kWiArIGR6ICogWk9PTV9SQVRFLCBNSU5fWiwgTUFYX1opO1xuXHRcdHRoaXMueiA9IGF2Zyh0aGlzLnosIHRoaXMuZW5kWiwgRklMVEVSX1dFSUdIVCk7XG5cdFx0dGhpcy5zMCA9IHRoaXMuY2FsY1MoMCk7XG5cdH1cblxuXHRjYWxjUyhkeikge1xuXHRcdHJldHVybiAxIC8gKHRoaXMueiArIGR6KTtcblx0fVxuXG5cdGdldFMoZHopIHtcblx0XHRyZXR1cm4gZHogPyB0aGlzLmNhbGNTKGR6KSA6IHRoaXMuczA7XG5cdH1cblxuXHR4dCh4LCBkeiA9IDApIHtcblx0XHRyZXR1cm4gKHggLSB0aGlzLngpICogdGhpcy5nZXRTKGR6KSArIC41O1xuXHR9XG5cblx0eXQoeSwgZHogPSAwKSB7XG5cdFx0cmV0dXJuICh5IC0gdGhpcy55KSAqIHRoaXMuZ2V0UyhkeikgKyAuNTtcblx0fVxuXG5cdHN0KHNpemUsIGR6ID0gMCkge1xuXHRcdHJldHVybiBzaXplICogdGhpcy5nZXRTKGR6KTtcblx0fVxuXG5cdHhpdCh4KSB7XG5cdFx0cmV0dXJuIHRoaXMueCArICh4IC0gLjUpICogdGhpcy56O1xuXHR9XG5cblx0eWl0KHkpIHtcblx0XHRyZXR1cm4gdGhpcy55ICsgKHkgLSAuNSkgKiB0aGlzLno7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG4iLCJjb25zdCBTdGF0ZSA9IHJlcXVpcmUoJy4vU3RhdGUnKTtcblxuY2xhc3MgQ29udHJvbGxlciB7XG5cdGNvbnN0cnVjdG9yKG1vdXNlVGFyZ2V0KSB7XG5cdFx0dGhpcy5tb3VzZVRhcmdldFdpZHRoID0gbW91c2VUYXJnZXQud2lkdGg7XG5cdFx0dGhpcy5tb3VzZVRhcmdldEhlaWdodCA9IG1vdXNlVGFyZ2V0LmhlaWdodDtcblxuXHRcdHRoaXMua2V5cyA9IHt9O1xuXHRcdHRoaXMubW91c2UgPSB7eDogbnVsbCwgeTogbnVsbH07XG5cdFx0dGhpcy50cmFuc2Zvcm1lZE1vdXNlID0ge307XG5cdFx0dGhpcy5tb3VzZVN0YXRlID0gbmV3IFN0YXRlKCk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgZXZlbnQgPT5cblx0XHRcdCFldmVudC5yZXBlYXQgJiYgdGhpcy5oYW5kbGVLZXlQcmVzcyhldmVudC5rZXkudG9Mb3dlckNhc2UoKSkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBldmVudCA9PlxuXHRcdFx0dGhpcy5oYW5kbGVLZXlSZWxlYXNlKGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpKSk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBldmVudCA9PlxuXHRcdFx0dGhpcy5oYW5kbGVNb3VzZU1vdmUoZXZlbnQueCAtIG1vdXNlVGFyZ2V0Lm9mZnNldExlZnQsIGV2ZW50LnkgLSBtb3VzZVRhcmdldC5vZmZzZXRUb3ApKTtcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsICgpID0+XG5cdFx0XHR0aGlzLmhhbmRsZU1vdXNlUHJlc3MoKSk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgKCkgPT5cblx0XHRcdHRoaXMuaGFuZGxlTW91c2VSZWxlYXNlKCkpO1xuXG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCAoKSA9PlxuXHRcdFx0dGhpcy5oYW5kbGVCbHVyKCkpO1xuXHR9XG5cblx0aGFuZGxlS2V5UHJlc3Moa2V5KSB7XG5cdFx0aWYgKCF0aGlzLmtleXNba2V5XSlcblx0XHRcdHRoaXMua2V5c1trZXldID0gbmV3IFN0YXRlKCk7XG5cdFx0dGhpcy5rZXlzW2tleV0ucHJlc3MoKTtcblx0fVxuXG5cdGhhbmRsZUtleVJlbGVhc2Uoa2V5KSB7XG5cdFx0aWYgKCF0aGlzLmtleXNba2V5XSlcblx0XHRcdHRoaXMua2V5c1trZXldID0gbmV3IFN0YXRlKCk7XG5cdFx0dGhpcy5rZXlzW2tleV0ucmVsZWFzZSgpO1xuXHR9XG5cblx0aGFuZGxlTW91c2VNb3ZlKHgsIHkpIHtcblx0XHR0aGlzLm1vdXNlLnggPSB4IC8gdGhpcy5tb3VzZVRhcmdldFdpZHRoO1xuXHRcdHRoaXMubW91c2UueSA9IHkgLyB0aGlzLm1vdXNlVGFyZ2V0SGVpZ2h0O1xuXHR9XG5cblx0aGFuZGxlTW91c2VQcmVzcygpIHtcblx0XHR0aGlzLm1vdXNlU3RhdGUucHJlc3MoKTtcblx0fVxuXG5cdGhhbmRsZU1vdXNlUmVsZWFzZSgpIHtcblx0XHR0aGlzLm1vdXNlU3RhdGUucmVsZWFzZSgpO1xuXHR9XG5cblx0aGFuZGxlQmx1cigpIHtcblx0XHRPYmplY3QudmFsdWVzKHRoaXMua2V5cylcblx0XHRcdC5maWx0ZXIoKHN0YXRlKSA9PiBzdGF0ZS5hY3RpdmUpXG5cdFx0XHQuZm9yRWFjaCgoc3RhdGUpID0+IHN0YXRlLnJlbGVhc2UoKSk7XG5cdH1cblxuXHQvLyBtYXAga2V5IChlLmcuICd6JykgdG8gc3RhdGVcblx0Z2V0S2V5U3RhdGUoa2V5KSB7XG5cdFx0cmV0dXJuIHRoaXMua2V5c1trZXldIHx8ICh0aGlzLmtleXNba2V5XSA9IG5ldyBTdGF0ZSgpKTtcblx0fVxuXG5cdGdldFJhd01vdXNlKGRlZmF1bHRYID0gMCwgZGVmYXVsdFkgPSAwKSB7XG5cdFx0cmV0dXJuIHRoaXMubW91c2UueCA/IHRoaXMubW91c2UgOiB7eDogZGVmYXVsdFgsIHk6IGRlZmF1bHRZfTtcblx0fVxuXG5cdGludmVyc2VUcmFuc2Zvcm1Nb3VzZShpbnZlcnNlVHJhbnNmb3JtZXIpIHtcblx0XHR0aGlzLnRyYW5zZm9ybWVkTW91c2UueCA9IGludmVyc2VUcmFuc2Zvcm1lci54aXQodGhpcy5tb3VzZS54KTtcblx0XHR0aGlzLnRyYW5zZm9ybWVkTW91c2UueSA9IGludmVyc2VUcmFuc2Zvcm1lci55aXQodGhpcy5tb3VzZS55KTtcblx0fVxuXG5cdGdldE1vdXNlKCkge1xuXHRcdHJldHVybiB0aGlzLnRyYW5zZm9ybWVkTW91c2U7XG5cdH1cblxuXHRnZXRNb3VzZVN0YXRlKCkge1xuXHRcdHJldHVybiB0aGlzLm1vdXNlU3RhdGU7XG5cdH1cblxuXHRleHBpcmUoKSB7XG5cdFx0T2JqZWN0LnZhbHVlcyh0aGlzLmtleXMpLmZvckVhY2goKHN0YXRlKSA9PiBzdGF0ZS5leHBpcmUoKSk7XG5cdFx0dGhpcy5tb3VzZVN0YXRlLmV4cGlyZSgpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udHJvbGxlcjtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBDb250cm9sbGVyID0gcmVxdWlyZSgnLi9Db250cm9sbGVyJyk7XG5cbmNvbnN0IEtleXMgPSBtYWtlRW51bShcblx0J01PVkVfTEVGVCcsXG5cdCdNT1ZFX1VQJyxcblx0J01PVkVfUklHSFQnLFxuXHQnTU9WRV9ET1dOJyxcblx0J0FCSUxJVFlfMScsXG5cdCdBQklMSVRZXzInLFxuXHQnQUJJTElUWV8zJyxcblx0J0FCSUxJVFlfNCcsXG5cdCdBQklMSVRZXzUnLFxuXHQnQUJJTElUWV82Jyxcblx0J0FCSUxJVFlfNycsXG5cdCdUQVJHRVRfTE9DSycsXG5cdCdaT09NX0lOJyxcblx0J1pPT01fT1VUJyxcblx0J01JTklNQVBfWk9PTScpO1xuXG5LZXlzLkFCSUxJVFlfSSA9IFtcblx0S2V5cy5BQklMSVRZXzEsXG5cdEtleXMuQUJJTElUWV8yLFxuXHRLZXlzLkFCSUxJVFlfMyxcblx0S2V5cy5BQklMSVRZXzQsXG5cdEtleXMuQUJJTElUWV81LFxuXHRLZXlzLkFCSUxJVFlfNixcblx0S2V5cy5BQklMSVRZXzddO1xuXG5jbGFzcyBLZXltYXBwaW5nIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5tYXAgPSB7fTtcblxuXHRcdHRoaXMubWFwW0tleXMuTU9WRV9MRUZUXSA9ICdhJztcblx0XHR0aGlzLm1hcFtLZXlzLk1PVkVfVVBdID0gJ3cnO1xuXHRcdHRoaXMubWFwW0tleXMuTU9WRV9SSUdIVF0gPSAnZCc7XG5cdFx0dGhpcy5tYXBbS2V5cy5NT1ZFX0RPV05dID0gJ3MnO1xuXHRcdHRoaXMubWFwW0tleXMuQUJJTElUWV8xXSA9ICdqJztcblx0XHR0aGlzLm1hcFtLZXlzLkFCSUxJVFlfMl0gPSAnayc7XG5cdFx0dGhpcy5tYXBbS2V5cy5BQklMSVRZXzNdID0gJ2wnO1xuXHRcdHRoaXMubWFwW0tleXMuQUJJTElUWV80XSA9ICd1Jztcblx0XHR0aGlzLm1hcFtLZXlzLkFCSUxJVFlfNV0gPSAnaSc7XG5cdFx0dGhpcy5tYXBbS2V5cy5BQklMSVRZXzZdID0gJ28nO1xuXHRcdHRoaXMubWFwW0tleXMuQUJJTElUWV83XSA9ICdwJztcblx0XHR0aGlzLm1hcFtLZXlzLlRBUkdFVF9MT0NLXSA9ICdjYXBzbG9jayc7XG5cdFx0dGhpcy5tYXBbS2V5cy5aT09NX0lOXSA9ICd4Jztcblx0XHR0aGlzLm1hcFtLZXlzLlpPT01fT1VUXSA9ICd6Jztcblx0XHR0aGlzLm1hcFtLZXlzLk1JTklNQVBfWk9PTV0gPSAncSc7XG5cdH1cblxuXHQvLyBtYXAgY29udHJvbCAoZS5nLiBaT09NX09VVCkgdG8ga2V5IChlLmcuICd6Jylcblx0Z2V0S2V5KGNvbnRyb2wpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXBbY29udHJvbF07XG5cdH1cblxuXHQvLyBtYXAgY29udHJvbCAoZS5nLiBaT09NX09VVCkgdG8gc3RhdGVcblx0Z2V0S2V5U3RhdGUoY29udHJvbGxlciwgY29udHJvbCkge1xuXHRcdHJldHVybiBjb250cm9sbGVyLmdldEtleVN0YXRlKHRoaXMuZ2V0S2V5KGNvbnRyb2wpKTtcblx0fVxufVxuXG5LZXltYXBwaW5nLktleXMgPSBLZXlzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtleW1hcHBpbmc7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xuXG5jb25zdCBTdGF0ZXMgPSBtYWtlRW51bSgnVVAnLCAnRE9XTicsICdQUkVTU0VEJywgJ1JFTEVBU0VEJyk7XG5cbmNsYXNzIFN0YXRlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zZXQoU3RhdGUuVVApO1xuXHR9XG5cblx0c2V0KHN0YXRlKSB7XG5cdFx0dGhpcy5zdGF0ZSA9IHN0YXRlO1xuXHR9XG5cblx0cHJlc3MoKSB7XG5cdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5QUkVTU0VEO1xuXHR9XG5cblx0cmVsZWFzZSgpIHtcblx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLlJFTEVBU0VEO1xuXHR9XG5cblx0ZXhwaXJlKCkge1xuXHRcdGlmICh0aGlzLnN0YXRlID09PSBTdGF0ZXMuUkVMRUFTRUQpXG5cdFx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLlVQO1xuXHRcdGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFN0YXRlcy5QUkVTU0VEKVxuXHRcdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5ET1dOO1xuXHR9XG5cblx0Z2V0IGFjdGl2ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5zdGF0ZSA9PT0gU3RhdGVzLlBSRVNTRUQgfHwgdGhpcy5zdGF0ZSA9PT0gU3RhdGVzLkRPV047XG5cdH1cblxuXHRnZXQgcHJlc3NlZCgpIHtcblx0XHRyZXR1cm4gdGhpcy5zdGF0ZSA9PT0gU3RhdGVzLlBSRVNTRUQ7XG5cdH1cbn1cblxuU3RhdGUuU3RhdGVzID0gU3RhdGVzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlO1xuIiwiY29uc3QgQm91bmRzID0gcmVxdWlyZSgnLi4vaW50ZXJzZWN0aW9uL0JvdW5kcycpO1xuY29uc3Qge3NldE1hZ25pdHVkZX0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuXG5jbGFzcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBsYXllcikge1xuXHRcdHRoaXMuYm91bmRzID0gbmV3IEJvdW5kcygpO1xuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0XHR0aGlzLmxheWVyID0gbGF5ZXI7XG5cdFx0dGhpcy5zZXRQb3NpdGlvbih4LCB5KTtcblx0XHR0aGlzLm1vdmVEaXJlY3Rpb24gPSB7eDogMCwgeTogMX07XG5cdH1cblxuXHRzZXRHcmFwaGljcyhncmFwaGljcykge1xuXHRcdHRoaXMuZ3JhcGhpY3MgPSBncmFwaGljcztcblx0fVxuXG5cdHNldFBvc2l0aW9uKHgsIHkpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy5zZXRCb3VuZHMoKTtcblx0fVxuXG5cdGNoZWNrTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKSB7XG5cdFx0cmV0dXJuIGludGVyc2VjdGlvbkZpbmRlci5jYW5Nb3ZlKHRoaXMubGF5ZXIsIHRoaXMuYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgbm9TbGlkZSk7XG5cdH1cblxuXHRzYWZlTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKSB7XG5cdFx0bGV0IG1vdmVYWSA9IGludGVyc2VjdGlvbkZpbmRlci5jYW5Nb3ZlKHRoaXMubGF5ZXIsIHRoaXMuYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgbm9TbGlkZSk7XG5cdFx0dGhpcy5tb3ZlKC4uLm1vdmVYWSk7XG5cdFx0cmV0dXJuIG1vdmVYWVsyXTtcblx0fVxuXG5cdG1vdmUoZHgsIGR5KSB7XG5cdFx0dGhpcy54ICs9IGR4O1xuXHRcdHRoaXMueSArPSBkeTtcblx0XHRpZiAoZHggfHwgZHkpXG5cdFx0XHR0aGlzLm1vdmVEaXJlY3Rpb24gPSBzZXRNYWduaXR1ZGUoZHgsIGR5KTtcblx0XHR0aGlzLnNldEJvdW5kcygpO1xuXHR9XG5cblx0YWRkSW50ZXJzZWN0aW9uQm91bmRzKGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdHRoaXMuaW50ZXJzZWN0aW9uSGFuZGxlID0gaW50ZXJzZWN0aW9uRmluZGVyLmFkZEJvdW5kcyh0aGlzLmxheWVyLCB0aGlzLmJvdW5kcywgdGhpcyk7XG5cdH1cblxuXHRyZW1vdmVJbnRlcnNlY3Rpb25Cb3VuZHMoaW50ZXJzZWN0aW9uRmluZGVyKSB7XG5cdFx0aW50ZXJzZWN0aW9uRmluZGVyLnJlbW92ZUJvdW5kcyh0aGlzLmxheWVyLCB0aGlzLmludGVyc2VjdGlvbkhhbmRsZSk7XG5cdH1cblxuXHRzZXRCb3VuZHMoKSB7XG5cdFx0bGV0IGhhbGZXaWR0aCA9IHRoaXMud2lkdGggLyAyO1xuXHRcdGxldCBoYWxmSGVpZ2h0ID0gdGhpcy5oZWlnaHQgLyAyO1xuXHRcdHRoaXMuYm91bmRzLnNldCh0aGlzLnggLSBoYWxmV2lkdGgsIHRoaXMueSAtIGhhbGZIZWlnaHQsIHRoaXMueCArIGhhbGZXaWR0aCwgdGhpcy55ICsgaGFsZkhlaWdodCk7XG5cdH1cblxuXHRjaGFuZ2VIZWFsdGgoYW1vdW50KSB7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHR0aGlzLmdyYXBoaWNzLnBhaW50KHBhaW50ZXIsIGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMubW92ZURpcmVjdGlvbik7XG5cdH1cblxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcbmNvbnN0IFBvb2wgPSByZXF1aXJlKCcuLi91dGlsL1Bvb2wnKTtcblxuY2xhc3MgTGl2aW5nRW50aXR5IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgaGVhbHRoLCBsYXllcikge1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKTtcblx0XHR0aGlzLmhlYWx0aCA9IG5ldyBQb29sKGhlYWx0aCk7XG5cdH1cblxuXHRjaGFuZ2VIZWFsdGgoYW1vdW50KSB7XG5cdFx0dGhpcy5oZWFsdGguY2hhbmdlKGFtb3VudCk7XG5cdH1cblxuXHRyZXN0b3JlSGVhbHRoKCkge1xuXHRcdHRoaXMuaGVhbHRoLnJlc3RvcmUoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpdmluZ0VudGl0eTtcbiIsImNvbnN0IExpdmluZ0VudGl0eSA9IHJlcXVpcmUoJy4vTGl2aW5nRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7VWlDcywgVWlQc30gPSByZXF1aXJlKCcuLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCBWU2hpcCA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL1ZTaGlwJyk7XG5jb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XG5jb25zdCBQcm9qZWN0aWxlQXR0YWNrID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL1Byb2plY3RpbGVBdHRhY2snKTtcbmNvbnN0IExhc2VyQXR0YWNrID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0xhc2VyQXR0YWNrJyk7XG5jb25zdCBEYXNoID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0Rhc2gnKTtcbmNvbnN0IEhlYWwgPSByZXF1aXJlKCcuLi9hYmlsaXRpZXMvSGVhbCcpO1xuY29uc3QgRGVjYXkgPSByZXF1aXJlKCcuLi91dGlsL0RlY2F5Jyk7XG5jb25zdCBLZXltYXBwaW5nID0gcmVxdWlyZSgnLi4vY29udHJvbC9LZXltYXBwaW5nJyk7XG5jb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vQm91bmRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCBib29sZWFuQXJyYXksIHJhbmQsIHJhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IER1c3QgPSByZXF1aXJlKCcuL3BhcnRpY2xlL0R1c3QnKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuY29uc3QgQmFyID0gcmVxdWlyZSgnLi4vcGFpbnRlci9CYXInKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcblxuY29uc3QgVEFSR0VUX0xPQ0tfQk9SREVSX1NJWkUgPSAuMDQ7XG5cbmNsYXNzIFBsYXllciBleHRlbmRzIExpdmluZ0VudGl0eSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKDAsIDAsIC4wNSwgLjA1LCAxLCBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkZSSUVORExZX1VOSVQpO1xuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFZTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IFVpQ3MuRW50aXR5LlBMQVlFUi5nZXQoKX0pKTtcblxuXHRcdHRoaXMuc3RhbWluYSA9IG5ldyBQb29sKDEwMCwgLjEzKTtcblx0XHR0aGlzLmFiaWxpdGllcyA9IFtuZXcgUHJvamVjdGlsZUF0dGFjaygwKSwgbmV3IERhc2goMSksIG5ldyBIZWFsKDIpXTtcblxuXHRcdHRoaXMucmVjZW50RGFtYWdlID0gbmV3IERlY2F5KC4xLCAuMDAxKTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGNvbnRyb2xsZXIsIGtleW1hcHBpbmcsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdHRoaXMucmVmcmVzaCgpO1xuXHRcdHRoaXMubW92ZUNvbnRyb2woY29udHJvbGxlciwga2V5bWFwcGluZywgaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0XHR0aGlzLmFiaWxpdHlDb250cm9sKG1hcCwgY29udHJvbGxlciwga2V5bWFwcGluZywgaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0XHR0aGlzLnRhcmdldExvY2tDb250cm9sKGNvbnRyb2xsZXIsIGtleW1hcHBpbmcsIGludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0dGhpcy5jcmVhdGVNb3ZlbWVudFBhcnRpY2xlKG1hcCk7XG5cdH1cblxuXHRyZWZyZXNoKCkge1xuXHRcdHRoaXMuc3RhbWluYS5pbmNyZW1lbnQoKTtcblx0fVxuXG5cdG1vdmVDb250cm9sKGNvbnRyb2xsZXIsIGtleW1hcHBpbmcsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGNvbnN0IGludlNxcnQyID0gMSAvIE1hdGguc3FydCgyKTtcblx0XHRjb25zdCBTUEVFRCA9IC4wMDU7XG5cblx0XHRsZXQgbGVmdCA9IGtleW1hcHBpbmcuZ2V0S2V5U3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5LZXlzLk1PVkVfTEVGVCkuYWN0aXZlO1xuXHRcdGxldCB1cCA9IGtleW1hcHBpbmcuZ2V0S2V5U3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5LZXlzLk1PVkVfVVApLmFjdGl2ZTtcblx0XHRsZXQgcmlnaHQgPSBrZXltYXBwaW5nLmdldEtleVN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuS2V5cy5NT1ZFX1JJR0hUKS5hY3RpdmU7XG5cdFx0bGV0IGRvd24gPSBrZXltYXBwaW5nLmdldEtleVN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuS2V5cy5NT1ZFX0RPV04pLmFjdGl2ZTtcblxuXHRcdGxldCBkeCA9IDAsIGR5ID0gMDtcblxuXHRcdGlmIChsZWZ0KVxuXHRcdFx0ZHggLT0gMTtcblx0XHRpZiAodXApXG5cdFx0XHRkeSAtPSAxO1xuXHRcdGlmIChyaWdodClcblx0XHRcdGR4ICs9IDE7XG5cdFx0aWYgKGRvd24pXG5cdFx0XHRkeSArPSAxO1xuXG5cdFx0aWYgKGR4ICYmIGR5KSB7XG5cdFx0XHRkeCA9IE1hdGguc2lnbihkeCkgKiBpbnZTcXJ0Mjtcblx0XHRcdGR5ID0gTWF0aC5zaWduKGR5KSAqIGludlNxcnQyO1xuXHRcdH1cblxuXHRcdHRoaXMuY3VycmVudE1vdmUgPSBbZHgsIGR5XTtcblx0XHR0aGlzLnNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBTUEVFRCk7XG5cdH1cblxuXHRhYmlsaXR5Q29udHJvbChtYXAsIGNvbnRyb2xsZXIsIGtleW1hcHBpbmcsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGxldCBkaXJlY3RUYXJnZXQgPSB0aGlzLnRhcmdldExvY2sgfHwgY29udHJvbGxlci5nZXRNb3VzZSgpO1xuXHRcdGxldCBkaXJlY3QgPSB7XG5cdFx0XHR4OiBkaXJlY3RUYXJnZXQueCAtIHRoaXMueCxcblx0XHRcdHk6IGRpcmVjdFRhcmdldC55IC0gdGhpcy55XG5cdFx0fTtcblxuXHRcdHRoaXMuYWJpbGl0aWVzXG5cdFx0XHQuZm9yRWFjaCgoYWJpbGl0eSwgaW5kZXgpID0+IHtcblx0XHRcdFx0YWJpbGl0eS5yZWZyZXNoKHRoaXMpO1xuXHRcdFx0XHRpZiAoa2V5bWFwcGluZy5nZXRLZXlTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLktleXMuQUJJTElUWV9JW2luZGV4XSkuYWN0aXZlKVxuXHRcdFx0XHRcdGFiaWxpdHkuc2FmZUFjdGl2YXRlKHRoaXMsIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRoaXMpO1xuXHRcdFx0fSk7XG5cdH1cblxuXHR0YXJnZXRMb2NrQ29udHJvbChjb250cm9sbGVyLCBrZXltYXBwaW5nLCBpbnRlcnNlY3Rpb25GaW5kZXIpIHtcblx0XHRpZiAodGhpcy50YXJnZXRMb2NrICYmIHRoaXMudGFyZ2V0TG9jay5oZWFsdGguaXNFbXB0eSgpKVxuXHRcdFx0dGhpcy50YXJnZXRMb2NrID0gbnVsbDtcblxuXHRcdGlmICgha2V5bWFwcGluZy5nZXRLZXlTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLktleXMuVEFSR0VUX0xPQ0spLnByZXNzZWQpXG5cdFx0XHRyZXR1cm47XG5cblx0XHRpZiAodGhpcy50YXJnZXRMb2NrKSB7XG5cdFx0XHR0aGlzLnRhcmdldExvY2sgPSBudWxsO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGxldCBtb3VzZSA9IGNvbnRyb2xsZXIuZ2V0TW91c2UoKTtcblx0XHRsZXQgdGFyZ2V0TG9ja0JvdW5kcyA9IG5ldyBCb3VuZHMoXG5cdFx0XHRtb3VzZS54IC0gVEFSR0VUX0xPQ0tfQk9SREVSX1NJWkUgLyAyLFxuXHRcdFx0bW91c2UueSAtIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFIC8gMixcblx0XHRcdG1vdXNlLnggKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSAvIDIsXG5cdFx0XHRtb3VzZS55ICsgVEFSR0VUX0xPQ0tfQk9SREVSX1NJWkUgLyAyKTtcblx0XHR0aGlzLnRhcmdldExvY2sgPSBpbnRlcnNlY3Rpb25GaW5kZXIuaGFzSW50ZXJzZWN0aW9uKEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9VTklULCB0YXJnZXRMb2NrQm91bmRzKTtcblx0fVxuXG5cdGNyZWF0ZU1vdmVtZW50UGFydGljbGUobWFwKSB7XG5cdFx0Y29uc3QgUkFURSA9IC40LCBTSVpFID0gLjAwNSwgRElSRUNUX1ZFTE9DSVRZID0gLjAwMywgUkFORF9WRUxPQ0lUWSA9IC4wMDE7XG5cblx0XHRpZiAoIWJvb2xlYW5BcnJheSh0aGlzLmN1cnJlbnRNb3ZlKSB8fCByYW5kKCkgPiBSQVRFKVxuXHRcdFx0cmV0dXJuO1xuXG5cdFx0bGV0IGRpcmVjdHYgPSBzZXRNYWduaXR1ZGUoLi4udGhpcy5jdXJyZW50TW92ZSwgLURJUkVDVF9WRUxPQ0lUWSk7XG5cdFx0bGV0IHJhbmR2ID0gcmFuZFZlY3RvcihSQU5EX1ZFTE9DSVRZKTtcblxuXHRcdG1hcC5hZGRQYXJ0aWNsZShuZXcgRHVzdCh0aGlzLngsIHRoaXMueSwgU0laRSwgZGlyZWN0di54ICsgcmFuZHZbMF0sIGRpcmVjdHYueSArIHJhbmR2WzFdLCAxMDApKTtcblx0fVxuXG5cdHN1ZmZpY2llbnRTdGFtaW5hKGFtb3VudCkge1xuXHRcdHJldHVybiBhbW91bnQgPD0gdGhpcy5zdGFtaW5hLmdldCgpO1xuXHR9XG5cblx0Y29uc3VtZVN0YW1pbmEoYW1vdW50KSB7XG5cdFx0dGhpcy5zdGFtaW5hLmNoYW5nZSgtYW1vdW50KTtcblx0fVxuXG5cdGNoYW5nZUhlYWx0aChhbW91bnQpIHtcblx0XHRzdXBlci5jaGFuZ2VIZWFsdGgoYW1vdW50KTtcblx0XHR0aGlzLnJlY2VudERhbWFnZS5hZGQoLWFtb3VudCk7XG5cdH1cblxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdC8vIHRhcmdldCBsb2NrXG5cdFx0Ly8gdG9kbyBbbWVkaXVtXSB0YXJnZXQgbG9jayBkcmF3cyBvdmVyIG1vbnN0ZXIgaGVhbGh0IGJhclxuXHRcdGlmICh0aGlzLnRhcmdldExvY2spXG5cdFx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy50YXJnZXRMb2NrLngsIHRoaXMudGFyZ2V0TG9jay55LFxuXHRcdFx0XHR0aGlzLnRhcmdldExvY2sud2lkdGggKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSwgdGhpcy50YXJnZXRMb2NrLmhlaWdodCArIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFLFxuXHRcdFx0XHR7Y29sb3I6IFVpQ3MuVEFSR0VUX0xPQ0suZ2V0KCksIHRoaWNrbmVzczogM30pKTtcblxuXHRcdC8vIGxpZmUgJiBzdGFtaW5hIGJhclxuXHRcdGNvbnN0IEhFSUdIVF9XSVRIX01BUkdJTiA9IFVpUHMuQkFSX0hFSUdIVCArIFVpUHMuTUFSR0lOO1xuXHRcdHBhaW50ZXIuYWRkKG5ldyBCYXIoVWlQcy5QTEFZRVJfQkFSX1gsIDEgLSBIRUlHSFRfV0lUSF9NQVJHSU4sIDEgLSBVaVBzLlBMQVlFUl9CQVJfWCAtIFVpUHMuTUFSR0lOLCBVaVBzLkJBUl9IRUlHSFQsIHRoaXMuc3RhbWluYS5nZXRSYXRpbygpLCBVaUNzLlNUQU1JTkEuZ2V0U2hhZGUoVWlDcy5CQVJfU0hBRElORyksIFVpQ3MuU1RBTUlOQS5nZXQoKSwgVWlDcy5TVEFNSU5BLmdldFNoYWRlKFVpQ3MuQkFSX1NIQURJTkcpKSk7XG5cdFx0cGFpbnRlci5hZGQobmV3IEJhcihVaVBzLlBMQVlFUl9CQVJfWCwgMSAtIEhFSUdIVF9XSVRIX01BUkdJTiAqIDIsIDEgLSBVaVBzLlBMQVlFUl9CQVJfWCAtIFVpUHMuTUFSR0lOLCBVaVBzLkJBUl9IRUlHSFQsIHRoaXMuaGVhbHRoLmdldFJhdGlvKCksIFVpQ3MuTElGRS5nZXRTaGFkZShVaUNzLkJBUl9TSEFESU5HKSwgVWlDcy5MSUZFLmdldCgpLCBVaUNzLkxJRkUuZ2V0U2hhZGUoVWlDcy5CQVJfU0hBRElORykpKTtcblxuXHRcdC8vIGFiaWxpdGllc1xuXHRcdHRoaXMuYWJpbGl0aWVzLmZvckVhY2goYWJpbGl0eSA9PiBhYmlsaXR5LnBhaW50VWkocGFpbnRlciwgY2FtZXJhKSk7XG5cblx0XHQvLyBkYW1hZ2Ugb3ZlcmxheVxuXHRcdGxldCBkYW1hZ2VDb2xvciA9IFVpQ3MuREFNQUdFLmdldEFscGhhKHRoaXMucmVjZW50RGFtYWdlLmdldCgpKTtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdCgwLCAwLCAxLCAxLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGRhbWFnZUNvbG9yfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtVaUNzfSA9IHJlcXVpcmUoJy4uL3V0aWwvVWlDb25zdGFudHMnKTtcbmNvbnN0IFJvY2tHcmFwaGljcyA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL1JvY2tHcmFwaGljJyk7XG5cbmNsYXNzIFJvY2sgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCBzaXplKSB7XG5cdFx0c3VwZXIoeCwgeSwgc2l6ZSwgc2l6ZSwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5QQVNTSVZFKTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSb2NrR3JhcGhpY3Moc2l6ZSwgc2l6ZSwge2ZpbGw6IHRydWUsIGNvbG9yOiBVaUNzLkVudGl0eS5ST0NLLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm9jaztcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3QgTGluZSA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvTGluZScpO1xuXG5jbGFzcyBMYXNlciBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIGR4LCBkeSwgdGltZSwgZGFtYWdlLCBmcmllbmRseSkge1xuXHRcdGNvbnN0IFRISUNLTkVTUyA9IC4wMDE7XG5cdFx0bGV0IGxheWVyID0gZnJpZW5kbHkgPyBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUgOiBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkhPU1RJTEVfUFJPSkVDVElMRTtcblx0XHRzdXBlcih4LCB5LCBUSElDS05FU1MsIFRISUNLTkVTUywgbGF5ZXIpO1xuXHRcdHRoaXMuZHggPSBkeDtcblx0XHR0aGlzLmR5ID0gZHk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGlmICghdGhpcy5tb3ZlWClcblx0XHRcdFt0aGlzLm1vdmVYLCB0aGlzLm1vdmVZLCB0aGlzLmludGVyc2VjdGlvbl0gPSB0aGlzLmNoZWNrTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIHRoaXMuZHgsIHRoaXMuZHksIC0xLCB0cnVlKTtcblxuXHRcdGlmICh0aGlzLnRpbWUtLSlcblx0XHRcdHJldHVybjtcblxuXHRcdGlmICh0aGlzLmludGVyc2VjdGlvbilcblx0XHRcdHRoaXMuaW50ZXJzZWN0aW9uLmNoYW5nZUhlYWx0aCgtdGhpcy5kYW1hZ2UpO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChMaW5lLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSwgdGhpcy54ICsgdGhpcy5tb3ZlWCwgdGhpcy55ICsgdGhpcy5tb3ZlWSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGFzZXI7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtyYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBEdXN0ID0gcmVxdWlyZSgnLi4vcGFydGljbGUvRHVzdCcpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIFByb2plY3RpbGUgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCB2eCwgdnksIHRpbWUsIGRhbWFnZSwgZnJpZW5kbHkpIHtcblx0XHRsZXQgbGF5ZXIgPSBmcmllbmRseSA/IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSA6IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFO1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKTtcblx0XHR0aGlzLnZ4ID0gdng7XG5cdFx0dGhpcy52eSA9IHZ5O1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdH1cblxuXHR1cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIpIHsgLy8gdG9kbyBbbWVkaXVtXSBmaXggbmFtaW5nIGRpc2Nvbm5lY3QsIG1hcCByZWZlcnMgdG8gbGFzZXJzIGFuZCBwcm9qZWN0aWxlcyBhcyBwcm9qZWN0aWxlcy4gZW50aXRpZXMgcmVmZXIgdG8gbGFzZXIgYW5kIHByb2plY3RpbGUgYXMgYXR0YWNrcy4gY3JlYXRlIHByb2plY3RpbGUvYXR0Y2FrIHBhcmVudCBjbGFzcyB0byBoYXZlIHVwZGF0ZSBpdGVyZmFjZVxuXHRcdGNvbnN0IEZSSUNUSU9OID0gLjk1O1xuXG5cdFx0bGV0IGludGVyc2VjdGlvbiA9IHRoaXMuc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLnZ4LCB0aGlzLnZ5LCAtMSwgdHJ1ZSk7XG5cblx0XHRpZiAoaW50ZXJzZWN0aW9uKSB7XG5cdFx0XHRpbnRlcnNlY3Rpb24uY2hhbmdlSGVhbHRoKC10aGlzLmRhbWFnZSk7XG5cdFx0XHRtYXAuYWRkUGFydGljbGUobmV3IER1c3QodGhpcy54LCB0aGlzLnksIC4wMDUsIC4uLnJhbmRWZWN0b3IoLjAwMSksIDEwMCkpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnRpbWUtLSlcblx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0dGhpcy52eCAqPSBGUklDVElPTjtcblx0XHR0aGlzLnZ5ICo9IEZSSUNUSU9OO1xuXG5cdFx0Ly8gdG9kbyBbbG93XSBkbyBkYW1hZ2Ugd2hlbiBjb2xsaWRlZCB3aXRoIChhcyBvcHBvc2VkIHRvIHdoZW4gY29sbGlkaW5nKVxuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHRoaXMueCwgdGhpcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2NvbG9yOiBVaUNzLkVudGl0eS5QUk9KRUNUSUxFLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvamVjdGlsZTtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xuY29uc3Qge3NldE1hZ25pdHVkZX0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xuXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XG5cbmNsYXNzIENoYXNlIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uZmlnKG9yaWdpbiwgc3BlZWQpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnNwZWVkID0gc3BlZWQ7XG5cdH1cblxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHRyZXR1cm47XG5cblx0XHRsZXQge3g6IGR4LCB5OiBkeX0gPSBzZXRNYWduaXR1ZGUodGFyZ2V0LnggLSB0aGlzLm9yaWdpbi54LCB0YXJnZXQueSAtIHRoaXMub3JpZ2luLnkpO1xuXG5cdFx0dGhpcy5vcmlnaW4uc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCBkeCwgZHksIHRoaXMuc3BlZWQpO1xuXHR9XG59XG5cbi8vIHRvZG8gW21lZGl1bV0gbWF5YmUgY2hhc2UgY2FuIGJlIGEgbW9kdWxlIHVzZWQgaW4gYSBuZWFyL2ZhciBtb2R1bGUgbWFuYWdlclxuXG5DaGFzZS5TdGFnZXMgPSBTdGFnZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhc2U7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xuY29uc3Qge2dldE1hZ25pdHVkZX0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xuXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XG5cbmNsYXNzIERpc3RhbmNlIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XG5cdC8vIGRpc3RhbmNlcyBzaG91bGQgYmUgaW4gaW5jcmVhc2luZyBvcmRlclxuXHQvLyBpZiB0aGlzLmRpc3RhbmNlcyA9IFsxMCwgMjBdLCB0aGVuIHBoYXNlIDEgPSBbMTAsIDIwKVxuXHRjb25maWcob3JpZ2luLCAuLi5kaXN0YW5jZXMpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLmRpc3RhbmNlcyA9IGRpc3RhbmNlcztcblx0fVxuXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLkFDVElWRSlcblx0XHRcdHJldHVybjtcblxuXHRcdGxldCB0YXJnZXREaXN0YW5jZSA9IGdldE1hZ25pdHVkZSh0YXJnZXQueCAtIHRoaXMub3JpZ2luLngsIHRhcmdldC55IC0gdGhpcy5vcmlnaW4ueSk7XG5cblx0XHRsZXQgcGhhc2UgPSB0aGlzLmRpc3RhbmNlcy5maW5kSW5kZXgoZGlzdGFuY2UgPT4gdGFyZ2V0RGlzdGFuY2UgPCBkaXN0YW5jZSk7XG5cdFx0aWYgKHBoYXNlID09PSAtMSlcblx0XHRcdHBoYXNlID0gdGhpcy5kaXN0YW5jZXMubGVuZ3RoO1xuXHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKHBoYXNlKTtcblxuXHRcdHRoaXMubW9kdWxlc0FwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpO1xuXHR9XG59XG5cbkRpc3RhbmNlLlN0YWdlcyA9IFN0YWdlcztcblxubW9kdWxlLmV4cG9ydHMgPSBEaXN0YW5jZTtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XG5jb25zdCB7Z2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdFTkdBR0VEJywgJ0RJU0VOR0FHRUQnKTtcblxuY2xhc3MgRW5nYWdlIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XG5cdGNvbmZpZyhvcmlnaW4sIG5lYXJEaXN0YW5jZSwgZmFyRGlzdGFuY2UpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLm5lYXJEaXN0YW5jZSA9IG5lYXJEaXN0YW5jZTtcblx0XHR0aGlzLmZhckRpc3RhbmNlID0gZmFyRGlzdGFuY2U7XG5cdH1cblxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHRyZXR1cm47XG5cblx0XHRsZXQgdGFyZ2V0RGlzdGFuY2UgPSBnZXRNYWduaXR1ZGUodGFyZ2V0LnggLSB0aGlzLm9yaWdpbi54LCB0YXJnZXQueSAtIHRoaXMub3JpZ2luLnkpO1xuXG5cdFx0aWYgKHRhcmdldERpc3RhbmNlIDwgdGhpcy5uZWFyRGlzdGFuY2UpXG5cdFx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZShQaGFzZXMuRU5HQUdFRCk7XG5cdFx0ZWxzZSBpZiAodGFyZ2V0RGlzdGFuY2UgPiB0aGlzLmZhckRpc3RhbmNlKVxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLkRJU0VOR0FHRUQpO1xuXG5cdFx0dGhpcy5tb2R1bGVzQXBwbHkobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCk7XG5cdH1cbn1cblxuRW5nYWdlLlN0YWdlcyA9IFN0YWdlcztcbkVuZ2FnZS5QaGFzZXMgPSBQaGFzZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gRW5nYWdlO1xuIiwiY2xhc3MgTW9kdWxlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zdGFnZSA9IDA7XG5cdH1cblxuXHRjb25maWcoKSB7XG5cdH1cblxuXHRzZXRTdGFnZXNNYXBwaW5nKHN0YWdlc01hcHMpIHtcblx0XHR0aGlzLnN0YWdlc01hcCA9IHN0YWdlc01hcHM7XG5cdH1cblxuXHRzZXRTdGFnZShwaGFzZSkge1xuXHRcdHRoaXMuc3RhZ2UgPSB0aGlzLnN0YWdlc01hcFtwaGFzZV07XG5cdH1cblxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgb3JpZ2luLCB0YXJnZXQpIHtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbnZhcykge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlO1xuIiwiY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcblxuY2xhc3MgTW9kdWxlTWFuYWdlciBleHRlbmRzIE1vZHVsZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5tb2R1bGVzID0gW107XG5cdFx0dGhpcy5waGFzZSA9IC0xO1xuXHR9XG5cblx0YWRkTW9kdWxlKG1vZHVsZSkge1xuXHRcdHRoaXMubW9kdWxlcy5wdXNoKG1vZHVsZSk7XG5cdH1cblxuXHRtb2R1bGVzU2V0U3RhZ2UocGhhc2UpIHtcblx0XHRpZiAocGhhc2UgPT09IHRoaXMucGhhc2UpXG5cdFx0XHRyZXR1cm47XG5cdFx0dGhpcy5waGFzZSA9IHBoYXNlO1xuXHRcdHRoaXMubW9kdWxlcy5mb3JFYWNoKG1vZHVsZSA9PlxuXHRcdFx0bW9kdWxlLnNldFN0YWdlKHBoYXNlKSk7XG5cdH1cblxuXHRtb2R1bGVzQXBwbHkobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdHRoaXMubW9kdWxlcy5mb3JFYWNoKG1vZHVsZSA9PlxuXHRcdFx0bW9kdWxlLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpKTtcblx0fVxuXG5cdG1vZHVsZXNQYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHR0aGlzLm1vZHVsZXMuZm9yRWFjaChtb2R1bGUgPT5cblx0XHRcdG1vZHVsZS5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZU1hbmFnZXI7XG5cbi8vIHRvZG8gW2xvd10gY29uc2lkZXIgbWVyZ2luZyBtb2R1bGVNYW5hZ2VyIGFuZCBtb2R1bGVcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xuY29uc3Qge2dldFJlY3REaXN0YW5jZX0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL1JlY3RDJyk7XG5cbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdXQVJOSU5HJywgJ0FDVElWRScsICdJTkFDVElWRScpO1xuXG5jbGFzcyBOZWFyYnlEZWdlbiBleHRlbmRzIE1vZHVsZSB7XG5cdGNvbmZpZyhvcmlnaW4sIHJhbmdlLCBkYW1hZ2UpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnJhbmdlID0gcmFuZ2U7XG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdH1cblxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHRyZXR1cm47XG5cdFx0bGV0IHRhcmdldERpc3RhbmNlID0gZ2V0UmVjdERpc3RhbmNlKHRhcmdldC54IC0gdGhpcy5vcmlnaW4ueCwgdGFyZ2V0LnkgLSB0aGlzLm9yaWdpbi55KTtcblx0XHRpZiAodGFyZ2V0RGlzdGFuY2UgPCB0aGlzLnJhbmdlKVxuXHRcdFx0dGFyZ2V0LmNoYW5nZUhlYWx0aCgtdGhpcy5kYW1hZ2UpO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5XQVJOSU5HKVxuXHRcdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHRoaXMub3JpZ2luLngsIHRoaXMub3JpZ2luLnksIHRoaXMucmFuZ2UgKiAyLCB0aGlzLnJhbmdlICogMiwge2NvbG9yOiBVaUNzLkFiaWxpdHkuTmVhcnlieURlZ2VuLldBUk5JTkdfQk9SREVSLmdldCgpfSkpO1xuXHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy5vcmlnaW4ueCwgdGhpcy5vcmlnaW4ueSwgdGhpcy5yYW5nZSAqIDIsIHRoaXMucmFuZ2UgKiAyLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IFVpQ3MuQWJpbGl0eS5OZWFyeWJ5RGVnZW4uQUNUSVZFX0ZJTEwuZ2V0KCl9KSk7XG5cdH1cbn1cblxuTmVhcmJ5RGVnZW4uU3RhZ2VzID0gU3RhZ2VzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5lYXJieURlZ2VuO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcbmNvbnN0IFRyaWdnZXIgPSByZXF1aXJlKCcuLi8uLi91dGlsL1RyaWdnZXInKTtcblxuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScsICdUUklHR0VSJyk7XG5cbmNsYXNzIFBoYXNlU2V0dGVyIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLnRyaWdnZXIgPSBuZXcgVHJpZ2dlcihTdGFnZXMuVFJJR0dFUik7XG5cdH1cblxuXHRjb25maWcocGhhc2UsIHBoYXNlVmFsdWUpIHtcblx0XHR0aGlzLnBoYXNlID0gcGhhc2U7XG5cdFx0dGhpcy5waGFzZVZhbHVlID0gcGhhc2VWYWx1ZTtcblx0fVxuXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSB8fCB0aGlzLnRyaWdnZXIudHJpZ2dlcih0aGlzLnN0YWdlKSlcblx0XHRcdHRoaXMucGhhc2Uuc2V0UGhhc2UodGhpcy5waGFzZVZhbHVlKTtcblx0XHRlbHNlIGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuSU5BQ1RJVkUpXG5cdFx0XHR0aGlzLnRyaWdnZXIudW50cmlnZ2VyKCk7XG5cdH1cbn1cblxuUGhhc2VTZXR0ZXIuU3RhZ2VzID0gU3RhZ2VzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBoYXNlU2V0dGVyO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcbmNvbnN0IFRyaWdnZXIgPSByZXF1aXJlKCcuLi8uLi91dGlsL1RyaWdnZXInKTtcblxuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScsICdUUklHR0VSJyk7XG5cbmNsYXNzIFJlc3RvcmUgZXh0ZW5kcyBNb2R1bGUge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMudHJpZ2dlciA9IG5ldyBUcmlnZ2VyKFN0YWdlcy5UUklHR0VSKTtcblx0fVxuXG5cdGNvbmZpZyhvcmlnaW4pIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0fVxuXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSB8fCB0aGlzLnRyaWdnZXIudHJpZ2dlcih0aGlzLnN0YWdlKSlcblx0XHRcdHRoaXMub3JpZ2luLnJlc3RvcmVIZWFsdGgoKTtcblx0XHRlbHNlIGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuSU5BQ1RJVkUpXG5cdFx0XHR0aGlzLnRyaWdnZXIudW50cmlnZ2VyKCk7XG5cdH1cbn1cblxuUmVzdG9yZS5TdGFnZXMgPSBTdGFnZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gUmVzdG9yZTtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xuY29uc3Qge3NldE1hZ25pdHVkZSwgcmFuZFZlY3Rvcn0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xuY29uc3QgUHJvamVjdGlsZSA9IHJlcXVpcmUoJy4uL2F0dGFjay9Qcm9qZWN0aWxlJyk7XG5cbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcblxuY2xhc3MgU2hvdGd1biBleHRlbmRzIE1vZHVsZSB7XG5cdGNvbmZpZyhvcmlnaW4sIHJhdGUsIGNvdW50LCB2ZWxvY2l0eSwgc3ByZWFkLCBkdXJhdGlvbiwgZGFtYWdlKSB7XG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XG5cdFx0dGhpcy5yYXRlID0gcmF0ZTtcblx0XHR0aGlzLmNvdW50ID0gY291bnQ7XG5cdFx0dGhpcy52ZWxpY2l0eSA9IHZlbG9jaXR5O1xuXHRcdHRoaXMuc3ByZWFkID0gc3ByZWFkO1xuXHRcdHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0fVxuXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLkFDVElWRSB8fCBNYXRoLnJhbmRvbSgpID4gdGhpcy5yYXRlKVxuXHRcdFx0cmV0dXJuO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvdW50OyBpKyspIHtcblx0XHRcdGxldCBkaXJlY3R2ID0gc2V0TWFnbml0dWRlKHRhcmdldC54IC0gdGhpcy5vcmlnaW4ueCwgdGFyZ2V0LnkgLSB0aGlzLm9yaWdpbi55LCB0aGlzLnZlbGljaXR5KTtcblx0XHRcdGxldCByYW5kdiA9IHJhbmRWZWN0b3IodGhpcy5zcHJlYWQpO1xuXG5cdFx0XHRsZXQgcHJvamVjdGlsZSA9IG5ldyBQcm9qZWN0aWxlKHRoaXMub3JpZ2luLngsIHRoaXMub3JpZ2luLnksIC4wMSwgLjAxLCBkaXJlY3R2LnggKyByYW5kdlswXSwgZGlyZWN0di55ICsgcmFuZHZbMV0sIHRoaXMuZHVyYXRpb24sIHRoaXMuZGFtYWdlLCBmYWxzZSk7XG5cdFx0XHRtYXAuYWRkUHJvamVjdGlsZShwcm9qZWN0aWxlKTtcblx0XHR9XG5cdH1cbn1cblxuU2hvdGd1bi5TdGFnZXMgPSBTdGFnZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gU2hvdGd1bjtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi9Nb25zdGVyJyk7XG5jb25zdCB7VWlDcywgVWlQc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvUGhhc2UnKTtcbmNvbnN0IEVuZ2FnZSA9IHJlcXVpcmUoJy4uL21vZHVsZS9FbmdhZ2UnKTtcbmNvbnN0IFBoYXNlU2V0dGVyID0gcmVxdWlyZSgnLi4vbW9kdWxlL1BoYXNlU2V0dGVyJyk7XG5jb25zdCBSZXN0b3JlID0gcmVxdWlyZSgnLi4vbW9kdWxlL1Jlc3RvcmUnKTtcbmNvbnN0IE5lYXJieURlZ2VuID0gcmVxdWlyZSgnLi4vbW9kdWxlL05lYXJieURlZ2VuJyk7XG5jb25zdCBTaG90Z3VuID0gcmVxdWlyZSgnLi4vbW9kdWxlL1Nob3RndW4nKTtcbmNvbnN0IFN0YXJTaGlwID0gcmVxdWlyZSgnLi4vLi4vZ3JhcGhpY3MvU3RhclNoaXAnKTtcbmNvbnN0IEJhciA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyJyk7XG5cbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdQUkVfREVHRU4nLCAnREVHRU4nLCAnUFJPSkVDVElMRScpO1xuXG5jbGFzcyBCb3NzMSBleHRlbmRzIE1vbnN0ZXIge1xuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XG5cdFx0c3VwZXIoeCwgeSwgLjA0LCAuMDQsIC41KTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBTdGFyU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBVaUNzLkVudGl0eS5NT05TVEVSLmdldCgpfSkpO1xuXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwLCAxMDAsIDEwMCwgMjAwKTtcblx0XHR0aGlzLmF0dGFja1BoYXNlLnNldFNlcXVlbnRpYWxTdGFydFBoYXNlKFBoYXNlcy5QUkVfREVHRU4pO1xuXHRcdHRoaXMuZW5yYWdlUGhhc2UgPSBuZXcgUGhhc2UoNjAwMCk7XG5cdFx0dGhpcy5lbnJhZ2VQaGFzZS5zZXRQaGFzZSgwKTtcblxuXHRcdGxldCBlbmdhZ2UgPSBuZXcgRW5nYWdlKCk7XG5cdFx0ZW5nYWdlLnNldFN0YWdlc01hcHBpbmcoe1xuXHRcdFx0W1BoYXNlcy5JTkFDVElWRV06IEVuZ2FnZS5TdGFnZXMuQUNUSVZFLFxuXHRcdFx0W1BoYXNlcy5QUkVfREVHRU5dOiBFbmdhZ2UuU3RhZ2VzLkFDVElWRSxcblx0XHRcdFtQaGFzZXMuREVHRU5dOiBFbmdhZ2UuU3RhZ2VzLkFDVElWRSxcblx0XHRcdFtQaGFzZXMuUFJPSkVDVElMRV06IEVuZ2FnZS5TdGFnZXMuQUNUSVZFXG5cdFx0fSk7XG5cdFx0ZW5nYWdlLmNvbmZpZyh0aGlzLCAuNSwgMSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZShlbmdhZ2UpO1xuXG5cdFx0bGV0IHBoYXNlU2V0dGVyRW5nYWdlQXR0YWNrID0gbmV3IFBoYXNlU2V0dGVyKCk7XG5cdFx0cGhhc2VTZXR0ZXJFbmdhZ2VBdHRhY2suc2V0U3RhZ2VzTWFwcGluZygoe1xuXHRcdFx0W0VuZ2FnZS5QaGFzZXMuRU5HQUdFRF06IFBoYXNlU2V0dGVyLlN0YWdlcy5UUklHR0VSLFxuXHRcdFx0W0VuZ2FnZS5QaGFzZXMuRElTRU5HQUdFRF06IFBoYXNlU2V0dGVyLlN0YWdlcy5JTkFDVElWRVxuXHRcdH0pKTtcblx0XHRwaGFzZVNldHRlckVuZ2FnZUF0dGFjay5jb25maWcodGhpcy5hdHRhY2tQaGFzZSwgUGhhc2VzLlBSRV9ERUdFTik7XG5cdFx0ZW5nYWdlLmFkZE1vZHVsZShwaGFzZVNldHRlckVuZ2FnZUF0dGFjayk7XG5cblx0XHRsZXQgcGhhc2VTZXR0ZXJFbmdhZ2VFbnJhZ2UgPSBuZXcgUGhhc2VTZXR0ZXIoKTtcblx0XHRwaGFzZVNldHRlckVuZ2FnZUVucmFnZS5zZXRTdGFnZXNNYXBwaW5nKCh7XG5cdFx0XHRbRW5nYWdlLlBoYXNlcy5FTkdBR0VEXTogUGhhc2VTZXR0ZXIuU3RhZ2VzLlRSSUdHRVIsXG5cdFx0XHRbRW5nYWdlLlBoYXNlcy5ESVNFTkdBR0VEXTogUGhhc2VTZXR0ZXIuU3RhZ2VzLklOQUNUSVZFXG5cdFx0fSkpO1xuXHRcdHBoYXNlU2V0dGVyRW5nYWdlRW5yYWdlLmNvbmZpZyh0aGlzLmVucmFnZVBoYXNlLCAwKTtcblx0XHRlbmdhZ2UuYWRkTW9kdWxlKHBoYXNlU2V0dGVyRW5nYWdlRW5yYWdlKTtcblxuXHRcdGxldCBwaGFzZVNldHRlckRpc2VuZ2FnZUF0dGFjayA9IG5ldyBQaGFzZVNldHRlcigpO1xuXHRcdHBoYXNlU2V0dGVyRGlzZW5nYWdlQXR0YWNrLnNldFN0YWdlc01hcHBpbmcoKHtcblx0XHRcdFtFbmdhZ2UuUGhhc2VzLkVOR0FHRURdOiBQaGFzZVNldHRlci5TdGFnZXMuSU5BQ1RJVkUsXG5cdFx0XHRbRW5nYWdlLlBoYXNlcy5ESVNFTkdBR0VEXTogUGhhc2VTZXR0ZXIuU3RhZ2VzLlRSSUdHRVJcblx0XHR9KSk7XG5cdFx0cGhhc2VTZXR0ZXJEaXNlbmdhZ2VBdHRhY2suY29uZmlnKHRoaXMuYXR0YWNrUGhhc2UsIFBoYXNlcy5JTkFDVElWRSk7XG5cdFx0ZW5nYWdlLmFkZE1vZHVsZShwaGFzZVNldHRlckRpc2VuZ2FnZUF0dGFjayk7XG5cblx0XHRsZXQgcmVzdG9yZSA9IG5ldyBSZXN0b3JlKCk7XG5cdFx0cmVzdG9yZS5zZXRTdGFnZXNNYXBwaW5nKCh7XG5cdFx0XHRbRW5nYWdlLlBoYXNlcy5FTkdBR0VEXTogUmVzdG9yZS5TdGFnZXMuSU5BQ1RJVkUsXG5cdFx0XHRbRW5nYWdlLlBoYXNlcy5ESVNFTkdBR0VEXTogUmVzdG9yZS5TdGFnZXMuVFJJR0dFUlxuXHRcdH0pKTtcblx0XHRyZXN0b3JlLmNvbmZpZyh0aGlzKTtcblx0XHRlbmdhZ2UuYWRkTW9kdWxlKHJlc3RvcmUpO1xuXG5cdFx0dGhpcy5uZWFyYnlEZWdlbiA9IG5ldyBOZWFyYnlEZWdlbigpO1xuXHRcdHRoaXMubmVhcmJ5RGVnZW4uc2V0U3RhZ2VzTWFwcGluZyh7XG5cdFx0XHRbUGhhc2VzLklOQUNUSVZFXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxuXHRcdFx0W1BoYXNlcy5QUkVfREVHRU5dOiBOZWFyYnlEZWdlbi5TdGFnZXMuV0FSTklORyxcblx0XHRcdFtQaGFzZXMuREVHRU5dOiBOZWFyYnlEZWdlbi5TdGFnZXMuQUNUSVZFLFxuXHRcdFx0W1BoYXNlcy5QUk9KRUNUSUxFXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFXG5cdFx0fSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZSh0aGlzLm5lYXJieURlZ2VuKTtcblxuXHRcdHRoaXMuc2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XG5cdFx0dGhpcy5zaG90Z3VuLnNldFN0YWdlc01hcHBpbmcoe1xuXHRcdFx0W1BoYXNlcy5JTkFDVElWRV06IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcblx0XHRcdFtQaGFzZXMuUFJFX0RFR0VOXTogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXG5cdFx0XHRbUGhhc2VzLkRFR0VOXTogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXG5cdFx0XHRbUGhhc2VzLlBST0pFQ1RJTEVdOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkVcblx0XHR9KTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHRoaXMuc2hvdGd1bik7XG5cblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xuXHR9XG5cblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSAhPT0gUGhhc2VzLklOQUNUSVZFKSB7XG5cdFx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxuXHRcdFx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xuXG5cdFx0XHRpZiAodGhpcy5lbnJhZ2VQaGFzZS5pc05ldygpKSB7XG5cdFx0XHRcdHRoaXMubmVhcmJ5RGVnZW4uY29uZmlnKHRoaXMsIC4zMywgLjAwMik7XG5cdFx0XHRcdHRoaXMuc2hvdGd1bi5jb25maWcodGhpcywgLjEsIDEwLCAuMDE1LCAuMDAzLCAxMDAsIC4wMDUpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodGhpcy5lbnJhZ2VQaGFzZS50aWNrKCkpIHtcblx0XHRcdFx0dGhpcy5uZWFyYnlEZWdlbi5jb25maWcodGhpcywgLjMzLCAuMDEpO1xuXHRcdFx0XHR0aGlzLnNob3RndW4uY29uZmlnKHRoaXMsIC4xLCAzMCwgLjAxOCwgLjAwNiwgMTAwLCAuMDA1KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5pc05ldygpKVxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc0FwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpO1xuXHR9XG5cblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSA9PT0gUGhhc2VzLklOQUNUSVZFKVxuXHRcdFx0cmV0dXJuO1xuXG5cdFx0cGFpbnRlci5hZGQobmV3IEJhcihcblx0XHRcdFVpUHMuTUFSR0lOLCBVaVBzLk1BUkdJTiwgMSAtIFVpUHMuTUFSR0lOICogMiwgVWlQcy5CQVJfSEVJR0hULCB0aGlzLmhlYWx0aC5nZXRSYXRpbygpLFxuXHRcdFx0VWlDcy5MSUZFLmdldFNoYWRlKFVpQ3MuQkFSX1NIQURJTkcpLCBVaUNzLkxJRkUuZ2V0KCksIFVpQ3MuTElGRS5nZXRTaGFkZShVaUNzLkJBUl9TSEFESU5HKSkpO1xuXHRcdHBhaW50ZXIuYWRkKG5ldyBCYXIoXG5cdFx0XHRVaVBzLk1BUkdJTiwgVWlQcy5NQVJHSU4gKiAyLjUsIDEgLSBVaVBzLk1BUkdJTiAqIDIsIFVpUHMuQkFSX0hFSUdIVCAqIC41LCB0aGlzLmVucmFnZVBoYXNlLmdldFJhdGlvKCksXG5cdFx0XHRVaUNzLkVOUkFHRS5nZXRTaGFkZSgpLCBVaUNzLkVOUkFHRS5nZXQoKSwgVWlDcy5FTlJBR0UuZ2V0U2hhZGUoKSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm9zczE7XG4iLCJjb25zdCBMaXZpbmdFbnRpdHkgPSByZXF1aXJlKCcuLi9MaXZpbmdFbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IE1vZHVsZU1hbmFnZXIgPSByZXF1aXJlKCcuLi9tb2R1bGUvTW9kdWxlTWFuYWdlcicpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3QgQmFyQyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyQycpO1xuXG5jbGFzcyBNb25zdGVyIGV4dGVuZHMgTGl2aW5nRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgaGVhbHRoKSB7XG5cdFx0c3VwZXIoeCwgeSwgd2lkdGgsIGhlaWdodCwgaGVhbHRoLCBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkhPU1RJTEVfVU5JVCk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyID0gbmV3IE1vZHVsZU1hbmFnZXIoKTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyKSB7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRzdXBlci5wYWludChwYWludGVyLCBjYW1lcmEpO1xuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzUGFpbnQocGFpbnRlciwgY2FtZXJhKTtcblx0XHRwYWludGVyLmFkZChCYXJDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSAtIHRoaXMuaGVpZ2h0LCAuMSwgLjAxLCB0aGlzLmhlYWx0aC5nZXRSYXRpbygpLFxuXHRcdFx0VWlDcy5MSUZFLmdldFNoYWRlKFVpQ3MuQkFSX1NIQURJTkcpLCBVaUNzLkxJRkUuZ2V0KCksIFVpQ3MuTElGRS5nZXRTaGFkZShVaUNzLkJBUl9TSEFESU5HKSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9uc3RlcjtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi9Nb25zdGVyJyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvUGhhc2UnKTtcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vbW9kdWxlL0Rpc3RhbmNlJyk7XG5jb25zdCBDaGFzZSA9IHJlcXVpcmUoJy4uL21vZHVsZS9DaGFzZScpO1xuY29uc3QgU2hvdGd1biA9IHJlcXVpcmUoJy4uL21vZHVsZS9TaG90Z3VuJyk7XG5jb25zdCBXU2hpcCA9IHJlcXVpcmUoJy4uLy4uL2dyYXBoaWNzL1dTaGlwJyk7XG5cbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcblxuY2xhc3MgU2hvdGd1bldhcnJpb3IgZXh0ZW5kcyBNb25zdGVyIHtcblx0Y29uc3RydWN0b3IoeCwgeSkge1xuXHRcdHN1cGVyKHgsIHksIC4wNCwgLjA0LCAuMDQpO1xuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFdTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IFVpQ3MuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XG5cblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xuXG5cdFx0bGV0IGRpc3RhbmNlID0gbmV3IERpc3RhbmNlKCk7XG5cdFx0ZGlzdGFuY2Uuc2V0U3RhZ2VzTWFwcGluZyh7W1BoYXNlcy5PTkVdOiBEaXN0YW5jZS5TdGFnZXMuQUNUSVZFfSk7XG5cdFx0ZGlzdGFuY2UuY29uZmlnKHRoaXMsIC4yNSwgLjU1KTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKGRpc3RhbmNlKTtcblxuXHRcdGxldCBjaGFzZSA9IG5ldyBDaGFzZSgpO1xuXHRcdGNoYXNlLnNldFN0YWdlc01hcHBpbmcoe1xuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxuXHRcdFx0MTogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRVxuXHRcdH0pO1xuXHRcdGNoYXNlLmNvbmZpZyh0aGlzLCAuMDAzKTtcblx0XHRkaXN0YW5jZS5hZGRNb2R1bGUoY2hhc2UpO1xuXG5cdFx0bGV0IHNob3RndW4gPSBuZXcgU2hvdGd1bigpO1xuXHRcdHNob3RndW4uc2V0U3RhZ2VzTWFwcGluZyh7XG5cdFx0XHQwOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXG5cdFx0XHQxOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcblx0XHRcdDI6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFXG5cdFx0fSk7XG5cdFx0c2hvdGd1bi5jb25maWcodGhpcywgLjA1LCAzLCAuMDE1LCAuMDAzLCAxMDAsIC4wMDUpO1xuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShzaG90Z3VuKTtcblxuXHRcdGRpc3RhbmNlLm1vZHVsZXNTZXRTdGFnZSgwKTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xuXHR9XG5cblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc0FwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2hvdGd1bldhcnJpb3I7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xuY29uc3QgTW9uc3RlciA9IHJlcXVpcmUoJy4vTW9uc3RlcicpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi91dGlsL1BoYXNlJyk7XG5jb25zdCBOZWFyYnlEZWdlbiA9IHJlcXVpcmUoJy4uL21vZHVsZS9OZWFyYnlEZWdlbicpO1xuY29uc3QgU3RhclNoaXAgPSByZXF1aXJlKCcuLi8uLi9ncmFwaGljcy9TdGFyU2hpcCcpO1xuXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnUkVTVCcsICdBVFRBQ0snKTtcblxuY2xhc3MgVHVycmV0IGV4dGVuZHMgTW9uc3RlciB7XG5cdGNvbnN0cnVjdG9yKHgsIHkpIHtcblx0XHRzdXBlcih4LCB5LCAuMDQsIC4wNCwgLjA0KTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBTdGFyU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBVaUNzLkVudGl0eS5NT05TVEVSLmdldCgpfSkpO1xuXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgyMDAsIDIwMCk7XG5cdFx0dGhpcy5hdHRhY2tQaGFzZS5zZXRSYW5kb21UaWNrKCk7XG5cblx0XHRsZXQgbmVhcmJ5RGVnZW4gPSBuZXcgTmVhcmJ5RGVnZW4oKTtcblx0XHRuZWFyYnlEZWdlbi5zZXRTdGFnZXNNYXBwaW5nKHtcblx0XHRcdFtQaGFzZXMuUkVTVF06IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcblx0XHRcdFtQaGFzZXMuQVRUQUNLXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLkFDVElWRVxuXHRcdH0pO1xuXHRcdG5lYXJieURlZ2VuLmNvbmZpZyh0aGlzLCAuNCwgLjAwMSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZShuZWFyYnlEZWdlbik7XG5cblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xuXHR9XG5cblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc0FwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHVycmV0O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgRHVzdCBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHNpemUsIHZ4LCB2eSwgdGltZSkge1xuXHRcdHN1cGVyKHgsIHksIHNpemUsIHNpemUsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSUdOT1JFKTtcblx0XHR0aGlzLnZ4ID0gdng7XG5cdFx0dGhpcy52eSA9IHZ5O1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0Y29uc3QgRlJJQ1RJT04gPSAuOTg7XG5cblx0XHRpZiAoIXRoaXMudGltZS0tKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR0aGlzLm1vdmUodGhpcy52eCwgdGhpcy52eSk7XG5cblx0XHR0aGlzLnZ4ICo9IEZSSUNUSU9OO1xuXHRcdHRoaXMudnkgKj0gRlJJQ1RJT047XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7Y29sb3I6IFVpQ3MuRW50aXR5LkRVU1QuZ2V0KCl9KSk7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IER1c3Q7XG4iLCJjb25zdCBQYXRoQ3JlYXRvciA9IHJlcXVpcmUoJy4vUGF0aENyZWF0b3InKTtcblxuY2xhc3MgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBwb2ludHMsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0dGhpcy5wYXRoQ3JlYXRvciA9IG5ldyBQYXRoQ3JlYXRvcigpO1xuXHRcdHRoaXMucGF0aENyZWF0b3Iuc2V0RmlsbChmaWxsKTtcblx0XHR0aGlzLnBhdGhDcmVhdG9yLnNldENvbG9yKGNvbG9yKTtcblx0XHR0aGlzLnBhdGhDcmVhdG9yLnNldFRoaWNrbmVzcyh0aGlja25lc3MpO1xuXHRcdHRoaXMucGF0aENyZWF0b3Iuc2V0U2NhbGUod2lkdGgsIGhlaWdodCwgR3JhcGhpY3MuY2FsY3VsYXRlU2NhbGUocG9pbnRzKSk7XG5cdFx0cG9pbnRzLmZvckVhY2gocG9pbnQgPT4gdGhpcy5wYXRoQ3JlYXRvci5tb3ZlVG8oLi4ucG9pbnQpKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSwgeCwgeSwgbW92ZURpcmVjdGlvbikge1xuXHRcdHRoaXMucGF0aENyZWF0b3Iuc2V0Q2FtZXJhKGNhbWVyYSk7XG5cdFx0dGhpcy5wYXRoQ3JlYXRvci5zZXRUcmFuc2xhdGlvbih4LCB5KTtcblx0XHR0aGlzLnBhdGhDcmVhdG9yLnNldEZvcndhcmQobW92ZURpcmVjdGlvbi54LCBtb3ZlRGlyZWN0aW9uLnkpO1xuXHRcdHBhaW50ZXIuYWRkKHRoaXMucGF0aENyZWF0b3IuY3JlYXRlKCkpXG5cdH1cblxuXHRzdGF0aWMgY2FsY3VsYXRlU2NhbGUocG9pbnRzKSB7XG5cdFx0bGV0IHhzID0gcG9pbnRzLm1hcCgoW3hdKSA9PiB4KTtcblx0XHRsZXQgeXMgPSBwb2ludHMubWFwKChbXywgeV0pID0+IHkpO1xuXHRcdGxldCB4ZCA9IE1hdGgubWF4KC4uLnhzKSAtIE1hdGgubWluKC4uLnhzKTtcblx0XHRsZXQgeWQgPSBNYXRoLm1heCguLi55cykgLSBNYXRoLm1pbiguLi55cyk7XG5cdFx0cmV0dXJuIDIgLyAoeGQgKyB5ZCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcmFwaGljcztcbiIsImNvbnN0IFBhdGggPSByZXF1aXJlKCcuLi9wYWludGVyL1BhdGgnKTtcblxuY2xhc3MgUGF0aENyZWF0b3Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnh5cyA9IFtdO1xuXHRcdHRoaXMuY3ggPSAuNTtcblx0XHR0aGlzLmN5ID0gLjU7XG5cdFx0dGhpcy5meCA9IDA7XG5cdFx0dGhpcy5meSA9IC0xO1xuXHRcdHRoaXMuc3ggPSAuMTtcblx0XHR0aGlzLnN5ID0gLjE7XG5cdFx0dGhpcy54ID0gMDtcblx0XHR0aGlzLnkgPSAwO1xuXHRcdHRoaXMucGF0aFBvaW50cyA9IFtdO1xuXHR9XG5cblx0c2V0Q2FtZXJhKGNhbWVyYSkge1xuXHRcdHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXHR9XG5cblx0c2V0RmlsbChmaWxsKSB7XG5cdFx0dGhpcy5maWxsID0gZmlsbDtcblx0fVxuXG5cdHNldENvbG9yKGNvbG9yKSB7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHR9XG5cblx0c2V0VGhpY2tuZXNzKHRoaWNrbmVzcykge1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzO1xuXHR9XG5cblx0c2V0VHJhbnNsYXRpb24oeCwgeSkge1xuXHRcdGlmICh0aGlzLmN4ID09PSB4ICYmIHRoaXMuY3kgPT09IHkpXG5cdFx0XHRyZXR1cm47XG5cdFx0dGhpcy5jeCA9IHg7XG5cdFx0dGhpcy5jeSA9IHk7XG5cdH1cblxuXHRzZXRGb3J3YXJkKHgsIHkpIHtcblx0XHRpZiAodGhpcy5meCA9PT0geCAmJiB0aGlzLmZ5ID09PSB5KVxuXHRcdFx0cmV0dXJuO1xuXHRcdHRoaXMuZnggPSB4O1xuXHRcdHRoaXMuZnkgPSB5O1xuXHR9XG5cblx0c2V0U2NhbGUoeCwgeSwgcykge1xuXHRcdGlmICh0aGlzLnN4ID09PSB4ICogcyAmJiB0aGlzLnN5ID09PSB5ICogcylcblx0XHRcdHJldHVybjtcblx0XHR0aGlzLnN4ID0geCAqIHM7XG5cdFx0dGhpcy5zeSA9IHkgKiBzO1xuXHR9XG5cblx0bW92ZVRvKHgsIHksIHNraXBBZGQpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0c2tpcEFkZCB8fCB0aGlzLmFkZCgpO1xuXHR9XG5cblx0bW92ZUJ5KHgsIHksIHNraXBBZGQpIHtcblx0XHR0aGlzLnggKz0geDtcblx0XHR0aGlzLnkgKz0geTtcblx0XHRza2lwQWRkIHx8IHRoaXMuYWRkKCk7XG5cdH1cblxuXHRhZGQoKSB7XG5cdFx0dGhpcy54eXMucHVzaChbdGhpcy54LCB0aGlzLnldKTtcblx0fVxuXG5cdGNyZWF0ZSgpIHtcblx0XHR0aGlzLmNvbXB1dGVQYXRoUG9pbnRzKCk7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHRoaXMucGF0aFBvaW50cywge2ZpbGw6IHRoaXMuZmlsbCwgY29sb3I6IHRoaXMuY29sb3IsIHRoaWNrbmVzczogdGhpcy50aGlja25lc3N9KTtcblx0fVxuXG5cdGNvbXB1dGVQYXRoUG9pbnRzKCkge1xuXHRcdC8vIFswLCAxXSBtYXBzIHRvIGNlbnRlciArIGZvcndhcmRcblx0XHR0aGlzLnBhdGhQb2ludHMgPSBbXTtcblx0XHR0aGlzLnh5cy5mb3JFYWNoKChbeCwgeV0pID0+IHtcblx0XHRcdHggKj0gdGhpcy5zeDtcblx0XHRcdHkgKj0gdGhpcy5zeTtcblx0XHRcdGxldCBwYXRoWCA9IHRoaXMuY3ggKyB0aGlzLmZ4ICogeSAtIHRoaXMuZnkgKiB4O1xuXHRcdFx0bGV0IHBhdGhZID0gdGhpcy5jeSArIHRoaXMuZnkgKiB5ICsgdGhpcy5meCAqIHg7XG5cdFx0XHR0aGlzLnBhdGhQb2ludHMucHVzaChbdGhpcy5jYW1lcmEueHQocGF0aFgpLCB0aGlzLmNhbWVyYS55dChwYXRoWSldKTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGhDcmVhdG9yO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5jb25zdCB7UEkyLCB0aGV0YVRvVmVjdG9yLCByYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbi8vIG1pbiBtYWduaXR1ZGUgb2YgYWxsIHBvaW50cyB3aWxsIGJlIE1JTl9NQUdOSVRVREUgLyAoTUlOX01BR05JVFVERSArIDEpXG5jb25zdCBQT0lOVFMgPSA1LCBNSU5fTUFHTklUVURFID0gMTtcblxuY2xhc3MgUm9ja0dyYXBoaWMgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0bGV0IHBvaW50cyA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgUE9JTlRTOyBpKyspXG5cdFx0XHRwb2ludHMucHVzaCh0aGV0YVRvVmVjdG9yKGkgKiBQSTIgLyBQT0lOVFMsIHJhbmQoKSArIE1JTl9NQUdOSVRVREUpKTtcblx0XHRzdXBlcih3aWR0aCwgaGVpZ2h0LCBwb2ludHMsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb2NrR3JhcGhpYztcbiIsImNvbnN0IEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcycpO1xuXG5jb25zdCBTID0gMSwgRCA9IC42LCBNID0gLjM7IC8vIFMgPSAxLCBEIDwgLjcsIE0gPCBEXG5cbmNvbnN0IFBPSU5UUyA9IFtcblx0Wy1TLCAwXSwgLy8gbGVmdFxuXHRbLUQsIE1dLFxuXHRbLUQsIERdLFxuXHRbLU0sIERdLFxuXHRbMCwgU10sIC8vIHRvcFxuXHRbTSwgRF0sXG5cdFtELCBEXSxcblx0W0QsIE1dLFxuXHRbUywgMF0sIC8vIHJpZ2h0XG5cdFtELCAtTV0sXG5cdFtELCAtRF0sXG5cdFtNLCAtRF0sXG5cdFswLCAtU10sIC8vIGJvdHRvbVxuXHRbLU0sIC1EXSxcblx0Wy1ELCAtRF0sXG5cdFstRCwgLU1dLFxuXTtcblxuY2xhc3MgU3RhclNoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0c3VwZXIod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhclNoaXA7XG4iLCJjb25zdCB7UEkyLCB0aGV0YVRvVmVjdG9yLCByYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxubGV0IHBvaW50cyA9IFtdO1xubGV0IG4gPSAyMDtcbmZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG5cdGxldCB0aGV0YSA9IGkgKiBQSTIgLyBuO1xuXHRsZXQgbWFnID0gcmFuZCgpICsgMjtcblx0bGV0IHZlY3RvciA9IHRoZXRhVG9WZWN0b3IodGhldGEsIG1hZyk7XG5cdHBvaW50cy5wdXNoKHZlY3Rvcik7XG59XG5cbmNsYXNzIFRlc3RTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdHN1cGVyKHdpZHRoLCBoZWlnaHQsIHBvaW50cywge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTaGlwO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFBPSU5UUyA9IFtcblx0WzAsIDMgLyAyXSwgLy8gZnJvbnRcblx0WzEsIC0xIC8gMl0sIC8vIHJpZ2h0XG5cdFswLCAtMyAvIDJdLCAvLyBiYWNrXG5cdFstMSwgLTEgLyAyXV07IC8vIGxlZnRcblxuY2xhc3MgVlNoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0c3VwZXIod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVlNoaXA7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gW1xuXHRbMSwgLjVdLFxuXHRbMywgMl0sXG5cdFsyLCAtMl0sXG5cdFswLCAtMV0sXG5cdFstMiwgLTJdLFxuXHRbLTMsIDJdLFxuXHRbLTEsIC41XV07XG5cbmNsYXNzIFdTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdHN1cGVyKHdpZHRoLCBoZWlnaHQsIFBPSU5UUywge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdTaGlwO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcbmNvbnN0IEludGVyZmFjZSA9IHJlcXVpcmUoJy4vSW50ZXJmYWNlJyk7XG5jb25zdCB7VWlDc30gPSByZXF1aXJlKCcuLi91dGlsL1VpQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0Jyk7XG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XG5cbmNvbnN0IFN0YXRlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdBQ1RJVkUnLCAnSE9WRVInKTtcblxuY2xhc3MgQnV0dG9uIGV4dGVuZHMgSW50ZXJmYWNlIHtcblx0Y29uc3RydWN0b3IodGV4dCkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5JTkFDVElWRTtcblx0XHR0aGlzLnRleHQgPSB0ZXh0O1xuXHR9XG5cblx0dXBkYXRlKGNvbnRyb2xsZXIpIHtcblx0XHRsZXQge3gsIHl9ID0gY29udHJvbGxlci5nZXRSYXdNb3VzZSgwLCAwKTtcblxuXHRcdGlmICghdGhpcy5ib3VuZHMuaW5zaWRlKHgsIHkpKVxuXHRcdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5JTkFDVElWRTtcblx0XHRlbHNlXG5cdFx0XHR0aGlzLnN0YXRlID0gY29udHJvbGxlci5nZXRNb3VzZVN0YXRlKCkuYWN0aXZlID8gU3RhdGVzLkFDVElWRSA6IFN0YXRlcy5IT1ZFUjtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0XHRsZXQgY29sb3IgPSBbVWlDcy5JbnRlcmZhY2UuSU5BQ1RJVkUsIFVpQ3MuSW50ZXJmYWNlLkFDVElWRSwgVWlDcy5JbnRlcmZhY2UuSE9WRVJdW3RoaXMuc3RhdGVdLmdldCgpO1xuXG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QodGhpcy5sZWZ0LCB0aGlzLnRvcCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcn0pKTtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdCh0aGlzLmxlZnQsIHRoaXMudG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCkpO1xuXHRcdHBhaW50ZXIuYWRkKG5ldyBUZXh0KHRoaXMubGVmdCArIHRoaXMud2lkdGggLyAyLCB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0IC8gMiwgdGhpcy50ZXh0KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b247XG4iLCJjb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vQm91bmRzJyk7XG5cbmNsYXNzIEludGVyZmFjZSB7XG5cdHNldFBvc2l0aW9uKGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMubGVmdCA9IGxlZnQ7XG5cdFx0dGhpcy50b3AgPSB0b3A7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMuYm91bmRzID0gbmV3IEJvdW5kcyhsZWZ0LCB0b3AsIGxlZnQgKyB3aWR0aCwgdG9wICsgaGVpZ2h0KTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyKSB7XG5cdH1cblxuXHRwYWludChwYWludGVyKSB7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2U7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xuXG5jb25zdCBEaXJlY3Rpb25zID0gbWFrZUVudW0oJ0xFRlQnLCAnVE9QJywgJ1JJR0hUJywgJ0JPVFRPTScpO1xuXG5jbGFzcyBCb3VuZHMge1xuXHRjb25zdHJ1Y3RvciguLi5sZWZ0VG9wUmlnaHRCb3R0b20pIHtcblx0XHRpZiAobGVmdFRvcFJpZ2h0Qm90dG9tKVxuXHRcdFx0dGhpcy5zZXQoLi4ubGVmdFRvcFJpZ2h0Qm90dG9tKTtcblx0fVxuXG5cdHNldChsZWZ0LCB0b3AsIHJpZ2h0ID0gbGVmdCwgYm90dG9tID0gdG9wKSB7XG5cdFx0dGhpcy52YWx1ZXMgPSBbXTtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLkxFRlRdID0gbGVmdDtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLlRPUF0gPSB0b3A7XG5cdFx0dGhpcy52YWx1ZXNbRGlyZWN0aW9ucy5SSUdIVF0gPSByaWdodDtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLkJPVFRPTV0gPSBib3R0b207XG5cdH1cblxuXHRnZXQoZGlyZWN0aW9uKSB7XG5cdFx0cmV0dXJuIHRoaXMudmFsdWVzW2RpcmVjdGlvbl07XG5cdH1cblxuXHRnZXRPcHBvc2l0ZShkaXJlY3Rpb24pIHtcblx0XHRyZXR1cm4gdGhpcy5nZXQoQm91bmRzLm9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbikpO1xuXHR9XG5cblx0aW50ZXJzZWN0cyhib3VuZHMpIHtcblx0XHRjb25zdCBzaWducyA9IFstMSwgLTEsIDEsIDFdO1xuXHRcdHJldHVybiB0aGlzLnZhbHVlcy5ldmVyeSgodmFsdWUsIGRpcmVjdGlvbikgPT5cblx0XHRcdHZhbHVlICogc2lnbnNbZGlyZWN0aW9uXSA+IGJvdW5kcy5nZXRPcHBvc2l0ZShkaXJlY3Rpb24pICogc2lnbnNbZGlyZWN0aW9uXSk7XG5cdH1cblxuXHRpbnNpZGUoeCwgeSl7XG5cdFx0cmV0dXJuIHRoaXMuaW50ZXJzZWN0cyhuZXcgQm91bmRzKHgsIHksIHgsIHkpKTtcblx0fVxuXG5cdHN0YXRpYyBvcHBvc2l0ZURpcmVjdGlvbihkaXJlY3Rpb24pIHtcblx0XHRzd2l0Y2ggKGRpcmVjdGlvbikge1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLkxFRlQ6XG5cdFx0XHRcdHJldHVybiBEaXJlY3Rpb25zLlJJR0hUO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLlRPUDpcblx0XHRcdFx0cmV0dXJuIERpcmVjdGlvbnMuQk9UVE9NO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLlJJR0hUOlxuXHRcdFx0XHRyZXR1cm4gRGlyZWN0aW9ucy5MRUZUO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLkJPVFRPTTpcblx0XHRcdFx0cmV0dXJuIERpcmVjdGlvbnMuVE9QO1xuXHRcdH1cblx0fVxufVxuXG5Cb3VuZHMuRGlyZWN0aW9ucyA9IERpcmVjdGlvbnM7XG5cbm1vZHVsZS5leHBvcnRzID0gQm91bmRzO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcbmNvbnN0IExpbmtlZExpc3QgPSByZXF1aXJlKCcuLi91dGlsL0xpbmtlZExpc3QnKTtcbmNvbnN0IHtFUFNJTE9OLCBtYXhXaGljaCwgc2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuL0JvdW5kcycpO1xuXG5jb25zdCBMYXllcnMgPSBtYWtlRW51bShcblx0J1BBU1NJVkUnLCAgICAgICAgICAgICAgLy8gaW50ZXJzZWN0cyB3aXRoIGV2ZXJ5dGhpbmdcblx0J0ZSSUVORExZX1BST0pFQ1RJTEUnLCAgLy8gaW50ZXJzZWN0cyB3aXRoIGhvc3RpbGUgdW5pdHMgYW5kIHBhc3NpdmVzXG5cdCdGUklFTkRMWV9VTklUJywgICAgICAgIC8vIGludGVyc2VjdHMgd2l0aCBob3N0aWxlIHVuaXRzLCBob3N0aWxlIHByb2plY3RpbGVzLCBhbmQgcGFzc2l2ZXNcblx0J0hPU1RJTEVfUFJPSkVDVElMRScsICAgLy8gaW50ZXJzZWN0cyB3aXRoIGZyaWVuZGx5IHVuaXRzIGFuZCBwYXNzaXZlc1xuXHQnSE9TVElMRV9VTklUJywgICAgICAgICAvLyBpbnRlcnNlY3RzIHdpdGggZnJpZW5kbHkgdW5pdHMsIGhvc3RpbGUgdW5pdHMsIGZyaWVuZGx5IHByb2plY3RpbGVzLCBhbmQgcGFzc2l2ZXNcblx0J0lHTk9SRScpOyAgICAgICAgICAgICAgLy8gaW50ZXJzZWN0cyB3aXRoIG5vdGhpbmdcblxuY2xhc3MgSW50ZXJzZWN0aW9uRmluZGVyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5jb2xsaXNpb25zID0gT2JqZWN0LmtleXMoTGF5ZXJzKS5tYXAoKCkgPT4gW10pO1xuXHRcdHRoaXMuYm91bmRzR3JvdXBzID0gT2JqZWN0LmtleXMoTGF5ZXJzKS5tYXAoKCkgPT4gbmV3IExpbmtlZExpc3QoKSk7XG5cblx0XHR0aGlzLmluaXRDb2xsaXNpb25zKCk7XG5cdH1cblxuXHRpbml0Q29sbGlzaW9ucygpIHtcblx0XHQvLyBwYXNzaXZlcyBpbnRlcnNlY3Qgd2l0aCBldmVyeXRoaW5nXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLlBBU1NJVkUsIExheWVycy5GUklFTkRMWV9VTklUKTtcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuUEFTU0lWRSwgTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUpO1xuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuRlJJRU5ETFlfVU5JVCk7XG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLlBBU1NJVkUsIExheWVycy5IT1NUSUxFX1BST0pFQ1RJTEUpO1xuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuSE9TVElMRV9VTklUKTtcblxuXHRcdC8vIGZyaWVuZGx5IHByb2plY3RpbGVzIGludGVyc2VjdCB3aXRoIGhvc3RpbGUgdW5pdHMgYW5kIHBhc3NpdmVzXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUsIExheWVycy5IT1NUSUxFX1VOSVQpO1xuXG5cdFx0Ly8gZnJpZW5kbHkgdW5pdHMgaW50ZXJzZWN0IHdpdGggaG9zdGlsZSB1bml0cywgaG9zdGlsZSBwcm9qZWN0aWxlcywgYW5kIHBhc3NpdmVzXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkZSSUVORExZX1VOSVQsIExheWVycy5IT1NUSUxFX1VOSVQpO1xuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5GUklFTkRMWV9VTklULCBMYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFKTtcblxuXHRcdC8vIGhvc3RpbGUgcHJvamVjdGlsZXMgaW50ZXJzZWN0IHdpdGggZnJpZW5kbHkgdW5pdHMgYW5kIHBhc3NpdmVzXG5cblx0XHQvLyBob3N0aWxlIHVpbnRzIGludGVyc2VjdHMgd2l0aCBmcmllbmRseSB1bml0cywgaG9zdGlsZSB1bml0cywgZnJpZW5kbHkgcHJvamVjdGlsZXMsIGFuZCBwYXNzaXZlc1xuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5IT1NUSUxFX1VOSVQsIExheWVycy5IT1NUSUxFX1VOSVQpO1xuXHR9XG5cblx0YWRkQ29sbGlzaW9uKGxheWVyMSwgbGF5ZXIyKSB7XG5cdFx0dGhpcy5jb2xsaXNpb25zW2xheWVyMV1bbGF5ZXIyXSA9IHRydWU7XG5cdFx0dGhpcy5jb2xsaXNpb25zW2xheWVyMl1bbGF5ZXIxXSA9IHRydWU7XG5cdH1cblxuXHRhZGRCb3VuZHMobGF5ZXIsIGJvdW5kcywgcmVmZXJlbmNlKSB7XG5cdFx0cmV0dXJuIHRoaXMuYm91bmRzR3JvdXBzW2xheWVyXS5hZGQoe2JvdW5kcywgcmVmZXJlbmNlfSlcblx0fVxuXG5cdHJlbW92ZUJvdW5kcyhsYXllciwgaXRlbSkge1xuXHRcdHJldHVybiB0aGlzLmJvdW5kc0dyb3Vwc1tsYXllcl0ucmVtb3ZlKGl0ZW0pO1xuXHR9XG5cblx0aGFzSW50ZXJzZWN0aW9uKGxheWVyLCBib3VuZHMpIHtcblx0XHRsZXQgaXRlbSA9IHRoaXMuYm91bmRzR3JvdXBzW2xheWVyXS5maW5kKCh7Ym91bmRzOiBpQm91bmRzfSkgPT5cblx0XHRcdGlCb3VuZHMuaW50ZXJzZWN0cyhib3VuZHMpKTtcblx0XHRyZXR1cm4gaXRlbSAmJiBpdGVtLnZhbHVlLnJlZmVyZW5jZTtcblx0fVxuXG5cdGNhbk1vdmUobGF5ZXIsIGJvdW5kcywgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcblx0XHQvLyBpZiBtYWduaXR1ZGUgaXMgLTEsIHRoZW4gPGR4LCBkeT4gaXMgbm90IG5lY2Vzc2FyaWx5IGEgdW5pdCB2ZWN0b3IsIGFuZCBpdHMgbWFnbml0dWRlIHNob3VsZCBiZSB1c2VkXG5cdFx0aWYgKG1hZ25pdHVkZSA9PT0gLTEpXG5cdFx0XHQoe3g6IGR4LCB5OiBkeSwgcHJldk1hZ25pdHVkZTogbWFnbml0dWRlfSA9IHNldE1hZ25pdHVkZShkeCwgZHkpKTtcblxuXHRcdGlmICghZHggJiYgIWR5IHx8IG1hZ25pdHVkZSA8PSAwKVxuXHRcdFx0cmV0dXJuIFswLCAwXTtcblxuXHRcdGxldCBtb3ZlWCA9IDAsIG1vdmVZID0gMDtcblxuXHRcdGxldCBob3Jpem9udGFsID0gZHggPD0gMCA/IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQgOiBCb3VuZHMuRGlyZWN0aW9ucy5SSUdIVDtcblx0XHRsZXQgdmVydGljYWwgPSBkeSA8PSAwID8gQm91bmRzLkRpcmVjdGlvbnMuVE9QIDogQm91bmRzLkRpcmVjdGlvbnMuQk9UVE9NO1xuXG5cdFx0bGV0IGludGVyc2VjdGlvblJlZmVyZW5jZTtcblx0XHRpZiAoZHggJiYgZHkpIHtcblx0XHRcdGxldCB7bW92ZSwgc2lkZSwgcmVmZXJlbmNlfSA9IHRoaXMuY2hlY2tNb3ZlRW50aXRpZXNJbnRlcnNlY3Rpb24obGF5ZXIsIGJvdW5kcywgZHgsIGR5LCBtYWduaXR1ZGUsIGhvcml6b250YWwsIHZlcnRpY2FsKTtcblxuXHRcdFx0bW92ZVggKz0gZHggKiBtb3ZlO1xuXHRcdFx0bW92ZVkgKz0gZHkgKiBtb3ZlO1xuXHRcdFx0bWFnbml0dWRlIC09IG1vdmU7XG5cblx0XHRcdGlmICghc2lkZSB8fCBub1NsaWRlKVxuXHRcdFx0XHRyZXR1cm4gW21vdmVYLCBtb3ZlWSwgcmVmZXJlbmNlXTtcblx0XHRcdGVsc2UgaWYgKHNpZGUgPT09IDEpIHtcblx0XHRcdFx0aG9yaXpvbnRhbCA9IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQ7XG5cdFx0XHRcdGR4ID0gMDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZlcnRpY2FsID0gQm91bmRzLkRpcmVjdGlvbnMuVE9QO1xuXHRcdFx0XHRkeSA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdGludGVyc2VjdGlvblJlZmVyZW5jZSA9IHJlZmVyZW5jZTtcblx0XHR9XG5cblx0XHRsZXQge21vdmUsIHJlZmVyZW5jZX0gPSB0aGlzLmNoZWNrTW92ZUVudGl0aWVzSW50ZXJzZWN0aW9uKGxheWVyLCBib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBob3Jpem9udGFsLCB2ZXJ0aWNhbCk7XG5cdFx0bW92ZVggKz0gZHggKiBtb3ZlO1xuXHRcdG1vdmVZICs9IGR5ICogbW92ZTtcblxuXHRcdHJldHVybiBbbW92ZVgsIG1vdmVZLCBpbnRlcnNlY3Rpb25SZWZlcmVuY2UgfHwgcmVmZXJlbmNlXTsgLy8gdG9kbyBbbG93XSBkb24ndCByZXR1cm4gbGlzdFxuXHRcdC8vIHRvZG8gW2xvd10gcmV0dXJuIGxpc3Qgb2YgYWxsIGludGVyc2VjdGlvbiByZWZlcmVuY2VzXG5cdH1cblxuXHRjaGVja01vdmVFbnRpdGllc0ludGVyc2VjdGlvbihsYXllciwgYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwpIHtcblx0XHRsZXQgaW50ZXJzZWN0aW9uID0ge21vdmU6IG1hZ25pdHVkZX07IC8vIHNpZGU6IDAgPSBub25lLCAxID0gaG9yaXpvbnRhbCwgMiA9IHZlcnRpY2FsXG5cblx0XHR0aGlzLmNvbGxpc2lvbnNbbGF5ZXJdLmZvckVhY2goKF8sIGlMYXllcikgPT5cblx0XHRcdHRoaXMuYm91bmRzR3JvdXBzW2lMYXllcl0uZm9yRWFjaCgoe2JvdW5kczogaUJvdW5kcywgcmVmZXJlbmNlfSkgPT4ge1xuXHRcdFx0XHRpZiAoaUJvdW5kcyA9PT0gYm91bmRzKVxuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0bGV0IGlJbnRlcnNlY3Rpb24gPSBJbnRlcnNlY3Rpb25GaW5kZXIuY2hlY2tNb3ZlRW50aXR5SW50ZXJzZWN0aW9uKGJvdW5kcywgZHgsIGR5LCBpbnRlcnNlY3Rpb24ubW92ZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIGlCb3VuZHMpO1xuXHRcdFx0XHRpZiAoaUludGVyc2VjdGlvbilcblx0XHRcdFx0XHRpbnRlcnNlY3Rpb24gPSB7Li4uaUludGVyc2VjdGlvbiwgcmVmZXJlbmNlfTtcblx0XHRcdH0pKTtcblxuXHRcdHJldHVybiBpbnRlcnNlY3Rpb247XG5cdH1cblxuXHRzdGF0aWMgY2hlY2tNb3ZlRW50aXR5SW50ZXJzZWN0aW9uKGJvdW5kcywgZHgsIGR5LCBtYWduaXR1ZGUsIGhvcml6b250YWwsIHZlcnRpY2FsLCBpQm91bmRzKSB7XG5cdFx0bGV0IGhvcml6b250YWxEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YShob3Jpem9udGFsLCBkeCwgYm91bmRzLCBpQm91bmRzLCBmYWxzZSk7XG5cdFx0bGV0IHZlcnRpY2FsRGVsdGEgPSBJbnRlcnNlY3Rpb25GaW5kZXIuZ2V0RGVsdGEodmVydGljYWwsIGR5LCBib3VuZHMsIGlCb3VuZHMsIGZhbHNlKTtcblxuXHRcdGlmIChob3Jpem9udGFsRGVsdGEgPj0gbWFnbml0dWRlIHx8IHZlcnRpY2FsRGVsdGEgPj0gbWFnbml0dWRlIHx8IGhvcml6b250YWxEZWx0YSA8IDAgJiYgdmVydGljYWxEZWx0YSA8IDApXG5cdFx0XHRyZXR1cm47XG5cblx0XHRsZXQgW21heERlbHRhLCB3aGljaERlbHRhXSA9IG1heFdoaWNoKGhvcml6b250YWxEZWx0YSwgdmVydGljYWxEZWx0YSk7XG5cblx0XHRsZXQgaG9yaXpvbnRhbEZhckRlbHRhID0gSW50ZXJzZWN0aW9uRmluZGVyLmdldERlbHRhKGhvcml6b250YWwsIGR4LCBib3VuZHMsIGlCb3VuZHMsIHRydWUpO1xuXHRcdGxldCB2ZXJ0aWNhbEZhckRlbHRhID0gSW50ZXJzZWN0aW9uRmluZGVyLmdldERlbHRhKHZlcnRpY2FsLCBkeSwgYm91bmRzLCBpQm91bmRzLCB0cnVlKTtcblxuXHRcdGlmIChtYXhEZWx0YSA+PSAwICYmIG1heERlbHRhIDwgTWF0aC5taW4oaG9yaXpvbnRhbEZhckRlbHRhLCB2ZXJ0aWNhbEZhckRlbHRhKSlcblx0XHRcdHJldHVybiB7bW92ZTogTWF0aC5tYXgobWF4RGVsdGEgLSBFUFNJTE9OLCAwKSwgc2lkZTogd2hpY2hEZWx0YSArIDF9O1xuXHR9XG5cblx0c3RhdGljIGdldERlbHRhKGRpcmVjdGlvbiwgZCwgYm91bmRzLCBpQm91bmRzLCBmYXIpIHtcblx0XHRpZiAoZCkge1xuXHRcdFx0aWYgKGZhcilcblx0XHRcdFx0ZGlyZWN0aW9uID0gQm91bmRzLm9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbik7XG5cdFx0XHRyZXR1cm4gKGlCb3VuZHMuZ2V0T3Bwb3NpdGUoZGlyZWN0aW9uKSAtIGJvdW5kcy5nZXQoZGlyZWN0aW9uKSkgLyBkO1xuXHRcdH1cblxuXHRcdHJldHVybiBpQm91bmRzLmdldE9wcG9zaXRlKGRpcmVjdGlvbikgPiBib3VuZHMuZ2V0KGRpcmVjdGlvbikgJiYgaUJvdW5kcy5nZXQoZGlyZWN0aW9uKSA8IGJvdW5kcy5nZXRPcHBvc2l0ZShkaXJlY3Rpb24pIF4gZmFyXG5cdFx0XHQ/IDAgOiBJbmZpbml0eTtcblx0fVxufVxuXG5JbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzID0gTGF5ZXJzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyc2VjdGlvbkZpbmRlcjtcblxuLy8gdG9kbyBbbG93XSBzdXBwb3J0IHJlY3Rhbmd1bGFyIG1vYmlsZSAocm90YXRpbmcpZW50aXRpZXNcbiIsImNvbnN0IExvZ2ljID0gcmVxdWlyZSgnLi9Mb2dpYycpO1xuY29uc3QgS2V5bWFwcGluZyA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvS2V5bWFwcGluZycpO1xuY29uc3QgTWFwID0gcmVxdWlyZSgnLi4vbWFwL01hcCcpO1xuY29uc3QgUGxheWVyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvUGxheWVyJyk7XG5jb25zdCBNYXBHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9tYXAvTWFwR2VuZXJhdG9yJyk7XG5jb25zdCBNaW5pbWFwID0gcmVxdWlyZSgnLi4vbWFwL01pbmltYXAnKTtcbmNvbnN0IENhbWVyYSA9IHJlcXVpcmUoJy4uL2NhbWVyYS9DYW1lcmEnKTtcbmNvbnN0IFN0YXJmaWVsZCA9IHJlcXVpcmUoJy4uL3N0YXJmaWVsZC9TdGFyZmllbGQnKTtcblxuY29uc3QgVUkgPSB0cnVlO1xuXG5jbGFzcyBHYW1lIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlcik7XG5cdFx0dGhpcy5rZXltYXBwaW5nID0gbmV3IEtleW1hcHBpbmcoKTtcblx0XHR0aGlzLm1hcCA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIoKTtcblx0XHRNYXBHZW5lcmF0b3IuZ2VuZXJhdGVTYW1wbGUodGhpcy5tYXAsIHRoaXMucGxheWVyKTtcblx0XHR0aGlzLm1pbmltYXAgPSBuZXcgTWluaW1hcCh0aGlzLm1hcCk7XG5cdFx0dGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuXHRcdHRoaXMuc3RhcmZpZWxkID0gbmV3IFN0YXJmaWVsZCguLi50aGlzLm1hcC5nZXRTaXplKCkpO1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdHRoaXMucGFpbnQoKTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLmNhbWVyYS5tb3ZlKHRoaXMucGxheWVyLCB0aGlzLmNvbnRyb2xsZXIuZ2V0UmF3TW91c2UoLjUsIC41KSk7XG5cdFx0dGhpcy5jYW1lcmEuem9vbSh0aGlzLmNvbnRyb2xsZXIsIHRoaXMua2V5bWFwcGluZyk7XG5cdFx0dGhpcy5jb250cm9sbGVyLmludmVyc2VUcmFuc2Zvcm1Nb3VzZSh0aGlzLmNhbWVyYSk7XG5cdFx0dGhpcy5tYXAudXBkYXRlKHRoaXMuY29udHJvbGxlciwgdGhpcy5rZXltYXBwaW5nKTtcblx0XHR0aGlzLm1pbmltYXAudXBkYXRlKHRoaXMuY29udHJvbGxlciwgdGhpcy5rZXltYXBwaW5nKTtcblx0fVxuXG5cdHBhaW50KCkge1xuXHRcdHRoaXMuc3RhcmZpZWxkLnBhaW50KHRoaXMucGFpbnRlciwgdGhpcy5jYW1lcmEpO1xuXHRcdHRoaXMubWFwLnBhaW50KHRoaXMucGFpbnRlciwgdGhpcy5jYW1lcmEpO1xuXHRcdHRoaXMubWluaW1hcC5wYWludCh0aGlzLnBhaW50ZXIpO1xuXHRcdGlmIChVSSlcblx0XHRcdHRoaXMubWFwLnBhaW50VWkodGhpcy5wYWludGVyLCB0aGlzLmNhbWVyYSlcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG5cbi8vIHRvZG8gW2dyYXBoaWNzXVxuLy8gdGV4dHVyZXNcbi8vIHVpIGludGVyZmFjZVxuXG4vLyB0b2RvIFtjb250ZW50XVxuLy8gbWFwIGdlbmVyYXRpb25cbi8vIGluc3RhbmNlc1xuLy8gbW9ic1xuLy8gc2VjdG9yIG1vZGVzXG4vLyByZXNvdXJjZXNcbi8vIGNyYWZ0aW5nXG4vLyBza2lsbCBsZXZlbGluZ1xuXG4vLyB0b2RvIFtvdGhlcl1cbi8vIGNoYXRcbi8vIHNhdmVcbi8vIG1pbmltYXBcblxuLy8gdG9kbyBbbW9uc3Rlcl1cbi8vIHNraXJtZXJzaGVyXG4vLyBsYXNlciwgc2hvcnQgcmFuZ2UgcmFpZGVyc1xuLy8gbGF0Y2hlcnMgdGhhdCByZWR1Y2UgbWF4IGhlYWx0aFxuLy8gbGlua2VycyB0aGF0IHJlZHVjZSBzcGVlZCBhbmQgZHJhaW4gaGVhbHRoXG4vLyB0cmFwc1xuLy8gZG90c1xuIiwiY29uc3QgTG9naWMgPSByZXF1aXJlKCcuL0xvZ2ljJyk7XG5jb25zdCBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWwvQ29sb3InKTtcbmNvbnN0IFRlc3RTaGlwID0gcmVxdWlyZSgnLi4vZ3JhcGhpY3MvVGVzdFNoaXAnKTtcbmNvbnN0IHt0aGV0YVRvVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNvbnN0IGlkZiA9IGEgPT4gYTtcblxuY2xhc3MgR3JhcGhpY3NEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlcik7XG5cdFx0dGhpcy53ID0gLjM7XG5cdFx0dGhpcy5oID0gLjM7XG5cdFx0dGhpcy54ID0gLjU7XG5cdFx0dGhpcy55ID0gLjU7XG5cdFx0dGhpcy50aGV0YSA9IDA7XG5cdFx0dGhpcy5kdGhldGEgPSAuMiAqIE1hdGguUEkgLyAxODA7XG5cdFx0dGhpcy5zaGlwID0gbmV3IFRlc3RTaGlwKHRoaXMudywgdGhpcy5oLCB7Y29sb3I6IENvbG9yLmZyb20xKDAsIDAsIDEpfSk7XG5cdFx0dGhpcy5mYWtlQ2FtZXJhID0ge3h0OiBpZGYsIHl0OiBpZGZ9O1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHRsZXQgZGlyZWN0aW9uID0gdGhldGFUb1ZlY3Rvcih0aGlzLnRoZXRhICs9IHRoaXMuZHRoZXRhKTtcblx0XHR0aGlzLnNoaXAucGFpbnQodGhpcy5wYWludGVyLCB0aGlzLmZha2VDYW1lcmEsIHRoaXMueCwgdGhpcy55LCB7eDogZGlyZWN0aW9uWzBdLCB5OiBkaXJlY3Rpb25bMV19KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyYXBoaWNzRGVtbztcbiIsImNvbnN0IExvZ2ljID0gcmVxdWlyZSgnLi9Mb2dpYycpO1xuY29uc3QgSW50ZXJmYWNlID0gcmVxdWlyZSgnLi4vaW50ZXJmYWNlL0ludGVyZmFjZScpO1xuY29uc3QgQnV0dG9uID0gcmVxdWlyZSgnLi4vaW50ZXJmYWNlL0J1dHRvbicpO1xuXG5jbGFzcyBJbnRlcmZhY2VEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlcik7XG5cblx0XHR0aGlzLmludGVyZmFjZSA9IG5ldyBCdXR0b24oKTtcblx0XHR0aGlzLmludGVyZmFjZS5zZXRQb3NpdGlvbiguMjUsIC4yNSwgLjIsIC4wNCk7XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHRcdHRoaXMuaW50ZXJmYWNlLnVwZGF0ZSh0aGlzLmNvbnRyb2xsZXIpO1xuXHRcdHRoaXMuaW50ZXJmYWNlLnBhaW50KHRoaXMucGFpbnRlcik7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2VEZW1vO1xuIiwiY2xhc3MgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0dGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcblx0XHR0aGlzLnBhaW50ZXIgPSBwYWludGVyO1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2ljO1xuIiwiY29uc3QgTGlua2VkTGlzdCA9IHJlcXVpcmUoJy4uL3V0aWwvTGlua2VkTGlzdCcpO1xuY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvRW50aXR5Jyk7XG5jb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IE1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL21hcC9NYXBHZW5lcmF0b3InKTtcbmNvbnN0IENhbWVyYSA9IHJlcXVpcmUoJy4uL2NhbWVyYS9DYW1lcmEnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIEZha2VQbGF5ZXIge1xuXHRzZXRQb3NpdGlvbigpIHtcblx0fVxufVxuXG5jbGFzcyBGYWtlTWFwIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5yb2NrcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5tb25zdGVycyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdH1cblxuXHRzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cdH1cblxuXHRhZGRSb2NrKHJvY2spIHtcblx0XHR0aGlzLnJvY2tzLmFkZChyb2NrKTtcblx0fVxuXG5cdGFkZFBsYXllcihwbGF5ZXIpIHtcblx0fVxuXG5cdGFkZE1vbnN0ZXIobW9uc3Rlcikge1xuXHRcdHRoaXMubW9uc3RlcnMuYWRkKG1vbnN0ZXIpO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0dGhpcy5yb2Nrcy5mb3JFYWNoKHJvY2sgPT4gcm9jay5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2gobW9uc3RlciA9PiBFbnRpdHkucHJvdG90eXBlLnBhaW50LmNhbGwobW9uc3RlciwgcGFpbnRlciwgY2FtZXJhKSk7IC8vIHRvIGF2b2lkIHBhaW50aW5nIG1vZHVsZXNcblx0fVxufVxuXG5jbGFzcyBNYXBEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlcik7XG5cdFx0dGhpcy5yZXNldCgpO1xuXHRcdHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLm1hcC53aWR0aCAvIDIsIHRoaXMubWFwLmhlaWdodCAvIDIsICh0aGlzLm1hcC53aWR0aCArIHRoaXMubWFwLmhlaWdodCkgLyAyKTtcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMubWFwID0gbmV3IEZha2VNYXAoKTtcblx0XHR0aGlzLnBsYXllciA9IG5ldyBGYWtlUGxheWVyKCk7XG5cdFx0TWFwR2VuZXJhdG9yLmdlbmVyYXRlU2FtcGxlKHRoaXMubWFwLCB0aGlzLnBsYXllcik7XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJyAnKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5yZXNldCgpO1xuXG5cdFx0dGhpcy51cGRhdGVDYW1lcmEoKTtcblxuXHRcdHRoaXMucGFpbnRlci5hZGQobmV3IFJlY3QoMCwgMCwgMSwgMSwge2ZpbGw6IHRydWV9KSk7XG5cdFx0dGhpcy5wYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKHRoaXMuY2FtZXJhLCB0aGlzLm1hcC53aWR0aCAvIDIsIHRoaXMubWFwLmhlaWdodCAvIDIsIHRoaXMubWFwLndpZHRoLCB0aGlzLm1hcC5oZWlnaHQsIHtjb2xvcjogQ29sb3IuV0hJVEUuZ2V0KCksIHRoaWNrbmVzczogMn0pKTtcblx0XHR0aGlzLm1hcC5wYWludCh0aGlzLnBhaW50ZXIsIHRoaXMuY2FtZXJhKTtcblx0fVxuXG5cdHVwZGF0ZUNhbWVyYSgpIHtcblx0XHRsZXQge3gsIHl9ID0gdGhpcy5jb250cm9sbGVyLmdldFJhd01vdXNlKCk7XG5cdFx0dGhpcy5jYW1lcmEubW92ZSh7eDogeCAqIHRoaXMubWFwLndpZHRoLCB5OiB5ICogdGhpcy5tYXAuaGVpZ2h0fSwge3gsIHl9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcERlbW87XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IHtOb2lzZVNpbXBsZXgsIE5vaXNlR3JhZGllbnR9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xuY29uc3Qge3JhbmR9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XG5cbmNvbnN0IFRIUkVTSE9MRCA9IC41O1xuY29uc3QgTiA9IDIwMDsgLy8gcmVzb2x1dGlvblxuY29uc3QgTlRIID0gMSAvIE47XG5jb25zdCBERUZBVUxUX05PSVNFX1JBTkdFID0gMjA7IC8vIGZlYXR1cmUgc2l6ZXMsIGJpZ2dlciBub2lzZVJhbmdlIG1lYW5zIHNtYWxsZXIgZmVhdHVyZXNcblxuY2xhc3MgTm9pc2VEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlcik7XG5cdFx0dGhpcy5ub2lzZVJhbmdlID0gREVGQVVMVF9OT0lTRV9SQU5HRTtcblx0XHR0aGlzLnJlc2V0KCk7XG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLnJlc3VsdHMgPSBbXTtcblx0XHRsZXQgbm9pc2UgPSBuZXcgTm9pc2VTaW1wbGV4KHRoaXMubm9pc2VSYW5nZSk7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBOOyB4KyspIHtcblx0XHRcdHRoaXMucmVzdWx0c1t4XSA9IFtdO1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBOOyB5KyspIHtcblx0XHRcdFx0bGV0IHIgPSBub2lzZS5nZXQoeCAqIE5USCwgeSAqIE5USCk7XG5cdFx0XHRcdGlmIChyID4gVEhSRVNIT0xEICsgcmFuZCgpKVxuXHRcdFx0XHRcdHRoaXMucmVzdWx0c1t4XVt5XSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLmNvbnRyb2woKTtcblx0XHR0aGlzLnBhaW50KCk7XG5cdH1cblxuXHRjb250cm9sKCkge1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJ2Fycm93ZG93bicpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UgLT0gNTtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd3VwJykucHJlc3NlZClcblx0XHRcdHRoaXMubm9pc2VSYW5nZSArPSA1O1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJ2Fycm93bGVmdCcpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UtLTtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd3JpZ2h0JykucHJlc3NlZClcblx0XHRcdHRoaXMubm9pc2VSYW5nZSsrO1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJyAnKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0cGFpbnQoKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBOOyB4KyspXG5cdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IE47IHkrKykge1xuXHRcdFx0XHRpZiAodGhpcy5yZXN1bHRzW3hdW3ldKSB7XG5cdFx0XHRcdFx0dGhpcy5wYWludGVyLmFkZChuZXcgUmVjdCh4ICogTlRILCB5ICogTlRILCAxIC8gTiwgMSAvIE4sIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3IuQkxBQ0suZ2V0KCl9KSk7XG5cdFx0XHRcdFx0dGhpcy5wYWludGVyLmFkZChuZXcgUmVjdEMoLjEsIC4xLCAuMDMsIC4wMywge2ZpbGw6IHRydWUsIGNvbG9yOiBgI2ZmZmB9KSk7XG5cdFx0XHRcdFx0dGhpcy5wYWludGVyLmFkZChuZXcgVGV4dCguMSwgLjEsIHRoaXMubm9pc2VSYW5nZSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOb2lzZURlbW87XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IENhbWVyYSA9IHJlcXVpcmUoJy4uL2NhbWVyYS9DYW1lcmEnKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xuY29uc3QgU3RhcmZpZWxkID0gcmVxdWlyZSgnLi4vc3RhcmZpZWxkL1N0YXJmaWVsZCcpO1xuY29uc3QgU3RhcmZpZWxkTm9pc2UgPSByZXF1aXJlKCcuLi9zdGFyZmllbGQvU3RhcmZpZWxkTm9pc2UnKTtcblxuY2xhc3MgU3RhcmZpZWxkRGVtbyBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlcikge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXIpO1xuXHRcdHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSgwLCAwLCAxKTtcblx0fVxuXG5cdGl0ZXJhdGUoKSB7XG5cdFx0dGhpcy5wZXJpb2RpY2FsbHlTd2FwU3RhcmZpZWxkKCk7XG5cdFx0bGV0IHt4LCB5fSA9IHRoaXMuY29udHJvbGxlci5nZXRSYXdNb3VzZSgpO1xuXHRcdHRoaXMuY2FtZXJhLm1vdmUoe3g6IHggLSAuNSwgeTogeSAtIC41fSwge3gsIHl9KTtcblx0XHR0aGlzLnN0YXJmaWVsZC5wYWludCh0aGlzLnBhaW50ZXIsIHRoaXMuY2FtZXJhKTtcblx0XHR0aGlzLnBhaW50ZXIuYWRkKG5ldyBUZXh0KC4wNSwgLjA1LCB0aGlzLm5vaXNlID8gJ25vaXNlJyA6ICdyYW5kJywge2NvbG9yOiBDb2xvci5XSElURS5nZXQoKX0pKTtcblx0fVxuXG5cdHBlcmlvZGljYWxseVN3YXBTdGFyZmllbGQoKSB7XG5cdFx0aWYgKCF0aGlzLml0ZXIpIHtcblx0XHRcdHRoaXMuaXRlciA9IDEwMDtcblx0XHRcdHRoaXMubm9pc2UgPSAhdGhpcy5ub2lzZTtcblx0XHRcdHRoaXMuc3RhcmZpZWxkID0gdGhpcy5ub2lzZSA/IG5ldyBTdGFyZmllbGROb2lzZSgxLCAxKSA6IG5ldyBTdGFyZmllbGQoMSwgMSk7XG5cdFx0fVxuXHRcdHRoaXMuaXRlci0tO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhcmZpZWxkRGVtbztcbiIsImNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IExpbmtlZExpc3QgPSByZXF1aXJlKCcuLi91dGlsL0xpbmtlZExpc3QnKTtcblxuY2xhc3MgTWFwIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIgPSBuZXcgSW50ZXJzZWN0aW9uRmluZGVyKCk7XG5cdFx0dGhpcy5yb2NrcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5tb25zdGVycyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5wYXJ0aWNsZXMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMudWlzID0gbmV3IExpbmtlZExpc3QoKTtcblx0fVxuXG5cdHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0fVxuXG5cdGdldFNpemUoKSB7XG5cdFx0cmV0dXJuIFt0aGlzLndpZHRoLCB0aGlzLmhlaWdodF07XG5cdH1cblxuXHRhZGRSb2NrKHJvY2spIHtcblx0XHR0aGlzLnJvY2tzLmFkZChyb2NrKTtcblx0XHRyb2NrLmFkZEludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdH1cblxuXHRhZGRQbGF5ZXIocGxheWVyKSB7XG5cdFx0dGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cdFx0cGxheWVyLmFkZEludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0dGhpcy51aXMuYWRkKHBsYXllcik7XG5cdH1cblxuXHRhZGRNb25zdGVyKG1vbnN0ZXIsIHVpKSB7XG5cdFx0dGhpcy5tb25zdGVycy5hZGQobW9uc3Rlcik7XG5cdFx0bW9uc3Rlci5hZGRJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHRcdGlmICh1aSlcblx0XHRcdHRoaXMudWlzLmFkZChtb25zdGVyKTtcblx0fVxuXG5cdGFkZFByb2plY3RpbGUocHJvamVjdGlsZSkge1xuXHRcdHRoaXMucHJvamVjdGlsZXMuYWRkKHByb2plY3RpbGUpO1xuXHRcdHByb2plY3RpbGUuYWRkSW50ZXJzZWN0aW9uQm91bmRzKHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0fVxuXG5cdGFkZFBhcnRpY2xlKHBhcnRpY2xlKSB7XG5cdFx0dGhpcy5wYXJ0aWNsZXMuYWRkKHBhcnRpY2xlKTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyLCBrZXltYXBwaW5nKSB7XG5cdFx0dGhpcy5wbGF5ZXIudXBkYXRlKHRoaXMsIGNvbnRyb2xsZXIsIGtleW1hcHBpbmcsIHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2goKG1vbnN0ZXIsIGl0ZW0pID0+IHtcblx0XHRcdGlmIChtb25zdGVyLmhlYWx0aC5pc0VtcHR5KCkpIHtcblx0XHRcdFx0dGhpcy5tb25zdGVycy5yZW1vdmUoaXRlbSk7XG5cdFx0XHRcdG1vbnN0ZXIucmVtb3ZlSW50ZXJzZWN0aW9uQm91bmRzKHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0XHRcdH0gZWxzZVxuXHRcdFx0XHRtb25zdGVyLnVwZGF0ZSh0aGlzLCB0aGlzLmludGVyc2VjdGlvbkZpbmRlciwgdGhpcy5wbGF5ZXIpO1xuXHRcdH0pO1xuXHRcdHRoaXMucHJvamVjdGlsZXMuZm9yRWFjaCgocHJvamVjdGlsZSwgaXRlbSkgPT4ge1xuXHRcdFx0aWYgKHByb2plY3RpbGUudXBkYXRlKHRoaXMsIHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKSkge1xuXHRcdFx0XHR0aGlzLnByb2plY3RpbGVzLnJlbW92ZShpdGVtKTtcblx0XHRcdFx0cHJvamVjdGlsZS5yZW1vdmVJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMucGFydGljbGVzLmZvckVhY2goKHBhcnRpY2xlLCBpdGVtKSA9PiB7XG5cdFx0XHRpZiAocGFydGljbGUudXBkYXRlKCkpXG5cdFx0XHRcdHRoaXMucGFydGljbGVzLnJlbW92ZShpdGVtKTtcblx0XHR9KTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHRoaXMucm9ja3MuZm9yRWFjaChyb2NrID0+IHJvY2sucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5wbGF5ZXIucGFpbnQocGFpbnRlciwgY2FtZXJhKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2gobW9uc3RlciA9PiBtb25zdGVyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSkpO1xuXHRcdHRoaXMucHJvamVjdGlsZXMuZm9yRWFjaChwcm9qZWN0aWxlID0+IHByb2plY3RpbGUucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5wYXJ0aWNsZXMuZm9yRWFjaChwYXJ0aWNsZSA9PiBwYXJ0aWNsZS5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0fVxuXG5cdHBhaW50VWkocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0dGhpcy51aXMuZm9yRWFjaCh1aSA9PiB7XG5cdFx0XHRpZiAodWkuaGVhbHRoLmlzRW1wdHkoKSlcblx0XHRcdFx0dGhpcy51aXMucmVtb3ZlKHVpKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dWkucGFpbnRVaShwYWludGVyLCBjYW1lcmEpO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwO1xuXG4vLyB0b2RvIFttZWRpdW1dIGNvbnNpZGVyIHN0YXRpYyAmIGR5bmFtaWMgZW50aXR5IGxpc3RzIGluIHN0ZWFkIG9mIGluZGl2aWR1YWwgdHlwZSBlbnRpdHkgbGlzdHNcbiIsImNvbnN0IHtyYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBSb2NrID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvUm9jaycpO1xuY29uc3QgVHVycmV0ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvVHVycmV0Jyk7XG5jb25zdCBTaG90Z3VuV2FycmlvciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL1Nob3RndW5XYXJyaW9yJyk7XG5jb25zdCBCb3NzMSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL0Jvc3MxJyk7XG5cbmNvbnN0IHtOb2lzZVNpbXBsZXh9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xuXG5jb25zdCBXSURUSCA9IDEwLCBIRUlHSFQgPSBXSURUSDtcblxuY2xhc3MgTWFwR2VuZXJhdG9yIHtcblxuXHRzdGF0aWMgZ2VuZXJhdGVTYW1wbGUobWFwLCBwbGF5ZXIpIHtcblx0XHRjb25zdCBST0NLUyA9IDEwMCwgVFVSUkVUUyA9IDAsIFNIT1RHVU5fV0FSUklPUlMgPSAxMDA7XG5cdFx0Y29uc3QgUk9DS19NQVhfU0laRSA9IC4xO1xuXG5cdFx0bGV0IG5vaXNlID0gbmV3IE5vaXNlU2ltcGxleCg1KTtcblxuXHRcdG1hcC5zZXRTaXplKFdJRFRILCBIRUlHSFQpO1xuXG5cdFx0cGxheWVyLnNldFBvc2l0aW9uKC4uLm5vaXNlLnBvc2l0aW9uc0xvd2VzdCgxMDAsIFdJRFRILCBIRUlHSFQpKTtcblx0XHRtYXAuYWRkUGxheWVyKHBsYXllcik7XG5cblx0XHRub2lzZS5wb3NpdGlvbnMoUk9DS1MsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gbWFwLmFkZFJvY2sobmV3IFJvY2soLi4ucG9zaXRpb24sIHJhbmQoUk9DS19NQVhfU0laRSkpKSk7XG5cdFx0bm9pc2UucG9zaXRpb25zKFRVUlJFVFMsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gbWFwLmFkZE1vbnN0ZXIobmV3IFR1cnJldCguLi5wb3NpdGlvbikpKTtcblx0XHRub2lzZS5wb3NpdGlvbnMoU0hPVEdVTl9XQVJSSU9SUywgV0lEVEgsIEhFSUdIVCkuZm9yRWFjaChwb3NpdGlvbiA9PiBtYXAuYWRkTW9uc3RlcihuZXcgU2hvdGd1bldhcnJpb3IoLi4ucG9zaXRpb24pKSk7XG5cdFx0bm9pc2UucG9zaXRpb25zKDEsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gbWFwLmFkZE1vbnN0ZXIobmV3IEJvc3MxKC4uLnBvc2l0aW9uKSwgdHJ1ZSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwR2VuZXJhdG9yO1xuIiwiY29uc3QgS2V5bWFwcGluZyA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvS2V5bWFwcGluZycpO1xuY29uc3QgQ2FtZXJhID0gcmVxdWlyZSgnLi4vY2FtZXJhL0NhbWVyYScpO1xuY29uc3Qge1VpQ3N9ID0gcmVxdWlyZSgnLi4vdXRpbC9VaUNvbnN0YW50cycpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIE1pbmltYXAge1xuXHRjb25zdHJ1Y3RvcihtYXApIHtcblx0XHR0aGlzLm1hcCA9IG1hcDtcblx0fVxuXG5cdHRvZ2dsZVpvb20oKSB7XG5cdFx0dGhpcy56b29tID0gIXRoaXMuem9vbTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyLCBrZXltYXBwaW5nKSB7XG5cdFx0aWYgKGtleW1hcHBpbmcuZ2V0S2V5U3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5LZXlzLk1JTklNQVBfWk9PTSkucHJlc3NlZClcblx0XHRcdHRoaXMudG9nZ2xlWm9vbSgpO1xuXHR9XG5cblx0Y3JlYXRlQ2FtZXJhKCkge1xuXHRcdGNvbnN0IE9GRlNFVCA9IC4wMSwgU0NBTEVfQkFTRV9TTUFMTCA9IC4xNSwgU0NBTEVfQkFTRV9MQVJHRSA9IC40O1xuXHRcdGxldCBzY2FsZSA9ICh0aGlzLnpvb20gPyBTQ0FMRV9CQVNFX0xBUkdFIDogU0NBTEVfQkFTRV9TTUFMTCk7XG5cdFx0cmV0dXJuIENhbWVyYS5jcmVhdGVGb3JSZWdpb24odGhpcy5tYXAud2lkdGgsIE9GRlNFVCwgT0ZGU0VULCBzY2FsZSk7XG5cdH1cblxuXHRwYWludChwYWludGVyKSB7XG5cdFx0bGV0IGNhbWVyYSA9IHRoaXMuY3JlYXRlQ2FtZXJhKCk7XG5cdFx0cGFpbnRlci5hZGQoUmVjdC53aXRoQ2FtZXJhKGNhbWVyYSwgMCwgMCwgdGhpcy5tYXAud2lkdGgsIHRoaXMubWFwLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBVaUNzLk1pbmltYXAuQkFDS0dST1VORC5nZXQoKX0pKTtcblx0XHR0aGlzLm1hcC5yb2Nrcy5mb3JFYWNoKHJvY2sgPT4gTWluaW1hcC5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHJvY2sueCwgcm9jay55LCBVaUNzLk1pbmltYXAuUk9DSy5nZXQoKSkpO1xuXHRcdHRoaXMubWFwLm1vbnN0ZXJzLmZvckVhY2gobW9uc3RlciA9PiBNaW5pbWFwLnBhaW50RG90KHBhaW50ZXIsIGNhbWVyYSwgbW9uc3Rlci54LCBtb25zdGVyLnksIFVpQ3MuTWluaW1hcC5NT05TVEVSLmdldCgpKSk7XG5cdFx0dGhpcy5tYXAudWlzLmZvckVhY2godWkgPT4gTWluaW1hcC5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHVpLngsIHVpLnksIFVpQ3MuTWluaW1hcC5CT1NTLmdldCgpKSk7XG5cdFx0TWluaW1hcC5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHRoaXMubWFwLnBsYXllci54LCB0aGlzLm1hcC5wbGF5ZXIueSwgVWlDcy5NaW5pbWFwLlBMQVlFUi5nZXQoKSk7XG5cdH1cblxuXHRzdGF0aWMgcGFpbnREb3QocGFpbnRlciwgY2FtZXJhLCB4LCB5LCBjb2xvcikge1xuXHRcdGNvbnN0IERPVF9TSVpFID0gLjI7XG5cdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHgsIHksIERPVF9TSVpFLCBET1RfU0laRSwge2ZpbGw6IHRydWUsIGNvbG9yfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWluaW1hcDtcbiIsImNvbnN0IFBhaW50ZXJFbGVtZW50ID0gcmVxdWlyZSgnLi9QYWludGVyRWxlbWVudCcpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpO1xuXG5jbGFzcyBCYXIgZXh0ZW5kcyBQYWludGVyRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpbGxSYXRpbywgZW1wdHlDb2xvciwgZmlsbENvbG9yLCBib3JkZXJDb2xvcikge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5lbXB0eSA9IG5ldyBSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZW1wdHlDb2xvcn0pO1xuXHRcdHRoaXMuZmlsbCA9IG5ldyBSZWN0KHgsIHksIHdpZHRoICogZmlsbFJhdGlvLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZmlsbENvbG9yfSk7XG5cdFx0dGhpcy5ib3JkZXIgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7Y29sb3I6IGJvcmRlckNvbG9yfSk7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHR0aGlzLmVtcHR5LnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5maWxsLnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5ib3JkZXIucGFpbnQoeHQsIHl0LCBjb250ZXh0KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhcjtcbiIsImNvbnN0IFBhaW50ZXJFbGVtZW50ID0gcmVxdWlyZSgnLi9QYWludGVyRWxlbWVudCcpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4vUmVjdCcpO1xuXG5jbGFzcyBCYXJDIGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmaWxsUmF0aW8sIGVtcHR5Q29sb3IsIGZpbGxDb2xvciwgYm9yZGVyQ29sb3IpIHtcblx0XHRzdXBlcigpO1xuXHRcdHggLT0gd2lkdGggLyAyO1xuXHRcdHkgLT0gaGVpZ2h0IC8gMjtcblx0XHR0aGlzLmVtcHR5ID0gbmV3IFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBlbXB0eUNvbG9yfSk7XG5cdFx0dGhpcy5maWxsID0gbmV3IFJlY3QoeCwgeSwgd2lkdGggKiBmaWxsUmF0aW8sIGhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBmaWxsQ29sb3J9KTtcblx0XHR0aGlzLmJvcmRlciA9IG5ldyBSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHtjb2xvcjogYm9yZGVyQ29sb3J9KTtcblx0fVxuXG5cdHN0YXRpYyB3aXRoQ2FtZXJhKGNhbWVyYSwgeCwgeSwgd2lkdGgsIGhlaWdodCwgZmlsbFJhdGlvLCBlbXB0eUNvbG9yLCBmaWxsQ29sb3IsIGJvcmRlckNvbG9yKSB7XG5cdFx0cmV0dXJuIG5ldyBCYXJDKGNhbWVyYS54dCh4KSwgY2FtZXJhLnl0KHkpLCBjYW1lcmEuc3Qod2lkdGgpLCBjYW1lcmEuc3QoaGVpZ2h0KSwgZmlsbFJhdGlvLCBlbXB0eUNvbG9yLCBmaWxsQ29sb3IsIGJvcmRlckNvbG9yKTtcblx0fVxuXG5cdHBhaW50KHh0LCB5dCwgY29udGV4dCkge1xuXHRcdHRoaXMuZW1wdHkucGFpbnQoeHQsIHl0LCBjb250ZXh0KTtcblx0XHR0aGlzLmZpbGwucGFpbnQoeHQsIHl0LCBjb250ZXh0KTtcblx0XHR0aGlzLmJvcmRlci5wYWludCh4dCwgeXQsIGNvbnRleHQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQmFyQztcbiIsImNvbnN0IFBhaW50ZXJFbGVtZW50ID0gcmVxdWlyZSgnLi9QYWludGVyRWxlbWVudCcpO1xuXG5jbGFzcyBMaW5lIGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB4MiwgeTIsIHtjb2xvciA9ICcjMDAwJywgdGhpY2tuZXNzID0gMX0gPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMueDIgPSB4Mjtcblx0XHR0aGlzLnkyID0geTI7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzXG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHgyLCB5Miwge2NvbG9yLCB0aGlja25lc3N9ID0ge30pIHtcblx0XHRyZXR1cm4gbmV3IExpbmUoY2FtZXJhLnh0KHgpLCBjYW1lcmEueXQoeSksIGNhbWVyYS54dCh4MiksIGNhbWVyYS55dCh5MiksIHtjb2xvciwgdGhpY2tuZXNzfSk7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHR0aGlzLnNldExpbmVNb2RlKGNvbnRleHQpO1xuXHRcdGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0Y29udGV4dC5tb3ZlVG8oeHQodGhpcy54KSwgeXQodGhpcy55KSk7XG5cdFx0Y29udGV4dC5saW5lVG8oeHQodGhpcy54MiksIHl0KHRoaXMueTIpKTtcblx0XHRjb250ZXh0LnN0cm9rZSgpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGluZTtcbiIsImNsYXNzIFBhaW50ZXIge1xuXHRjb25zdHJ1Y3RvcihjYW52YXMpIHtcblx0XHR0aGlzLndpZHRoID0gY2FudmFzLndpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcblx0XHQvLyB0aGlzLmNyZWF0ZU1hc2soKTtcblx0XHR0aGlzLnhDb29yZGluYXRlVHJhbnNmb3JtID0geCA9PiB4ICogdGhpcy53aWR0aDtcblx0XHR0aGlzLnlDb29yZGluYXRlVHJhbnNmb3JtID0geSA9PiB5ICogdGhpcy5oZWlnaHQ7XG5cdFx0dGhpcy5jb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5zZXRGb250TW9kZSgpO1xuXHRcdHRoaXMuZWxlbWVudHMgPSBbXTtcblx0fVxuXG5cdGNyZWF0ZU1hc2soKSB7XG5cdFx0dGhpcy5tYXNrQ2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7IC8vIHRvZG8gW2xvd10gYmV0dGVyIHdheSBvZiBjcmVhdGluZyBjYW52YXNcblx0XHR0aGlzLm1hc2tDYW52YXMud2lkdGggPSB0aGlzLndpZHRoO1xuXHRcdHRoaXMubWFza0NhbnZhcy5oZWlnaHQgPSB0aGlzLmhlaWdodDtcblx0XHR0aGlzLm1hc2tDb250ZXh0ID0gdGhpcy5tYXNrQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdH1cblxuXHRzZXRGb250TW9kZSgpIHtcblx0XHR0aGlzLmNvbnRleHQuZm9udCA9ICcxOHB4IG1vbm9zcGFjZSc7XG5cdFx0dGhpcy5jb250ZXh0LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRcdHRoaXMuY29udGV4dC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcblx0fVxuXG5cdGNsZWFyKCkge1xuXHRcdHRoaXMuZWxlbWVudHMgPSBbXTtcblx0fVxuXG5cdGFkZChlbGVtZW50KSB7XG5cdFx0dGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xuXHR9XG5cblx0cGFpbnQoKSB7XG5cdFx0dGhpcy5jb250ZXh0LmNsZWFyUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cdFx0dGhpcy5lbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT5cblx0XHRcdGVsZW1lbnQucGFpbnQodGhpcy54Q29vcmRpbmF0ZVRyYW5zZm9ybSwgdGhpcy55Q29vcmRpbmF0ZVRyYW5zZm9ybSwgdGhpcy5jb250ZXh0KSk7XG5cblx0XHQvLyB0aGlzLm1hc2tDb250ZXh0Lmdsb2JhbENvbXBvc2l0ZU9wZXJhdGlvbiA9ICdzb3VyY2Utb3Zlcic7XG5cdFx0Ly8gdGhpcy5tYXNrQ29udGV4dC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG5cdFx0Ly8gdGhpcy5tYXNrQ29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cdFx0Ly8gdGhpcy5tYXNrQ29udGV4dC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAneG9yJztcblx0XHQvLyB0aGlzLm1hc2tDb250ZXh0LmZpbGxSZWN0KDEwMCwgMTAwLCA1MDAsIDUwMCk7XG5cdFx0Ly8gdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLm1hc2tDYW52YXMsIDAsIDApO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFpbnRlcjtcbiIsImNsYXNzIFBhaW50ZXJFbGVtZW50IHtcblx0c2V0RmlsbE1vZGUoY29udGV4dCkge1xuXHRcdGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcblx0fVxuXG5cdHNldExpbmVNb2RlKGNvbnRleHQpIHtcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcblx0XHRjb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMudGhpY2tuZXNzO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlcikge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFpbnRlckVsZW1lbnQ7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcblxuY2xhc3MgUGF0aCBleHRlbmRzIFBhaW50ZXJFbGVtZW50IHtcblx0Y29uc3RydWN0b3IoeHlzLCB7ZmlsbCwgY29sb3IgPSAnIzAwMCcsIHRoaWNrbmVzcyA9IDF9ID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMueHlzID0geHlzO1xuXHRcdHRoaXMuZmlsbCA9IGZpbGw7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzO1xuXHR9XG5cblx0cGFpbnQoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0aWYgKHRoaXMuZmlsbCkge1xuXHRcdFx0dGhpcy5zZXRGaWxsTW9kZShjb250ZXh0KTtcblx0XHRcdHRoaXMucGFpbnRQYXRoKHh0LCB5dCwgY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LmZpbGwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZXRMaW5lTW9kZShjb250ZXh0KTtcblx0XHRcdHRoaXMucGFpbnRQYXRoKHh0LCB5dCwgY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LnN0cm9rZSgpO1xuXHRcdH1cblx0fVxuXG5cdHBhaW50UGF0aCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHRjb250ZXh0LmJlZ2luUGF0aCgpO1xuXHRcdGxldCB4eXQgPSB4eSA9PiBbeHQoeHlbMF0pLCB5dCh4eVsxXSldO1xuXHRcdGNvbnRleHQubW92ZVRvKC4uLnh5dCh0aGlzLnh5c1swXSkpO1xuXHRcdHRoaXMueHlzLmZvckVhY2goeHkgPT5cblx0XHRcdGNvbnRleHQubGluZVRvKC4uLnh5dCh4eSkpKTtcblx0XHRjb250ZXh0LmNsb3NlUGF0aCgpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGF0aDtcbiIsImNvbnN0IFBhaW50ZXJFbGVtZW50ID0gcmVxdWlyZSgnLi9QYWludGVyRWxlbWVudCcpO1xuXG5jbGFzcyBSZWN0IGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IgPSAnIzAwMCcsIHRoaWNrbmVzcyA9IDF9ID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cdFx0dGhpcy5maWxsID0gZmlsbDtcblx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdFx0dGhpcy50aGlja25lc3MgPSB0aGlja25lc3M7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0cmV0dXJuIG5ldyBSZWN0KGNhbWVyYS54dCh4KSwgY2FtZXJhLnl0KHkpLCBjYW1lcmEuc3Qod2lkdGgpLCBjYW1lcmEuc3QoaGVpZ2h0KSwge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9KTtcblx0fVxuXG5cdHBhaW50KHh0LCB5dCwgY29udGV4dCkge1xuXHRcdGxldCB0eCA9IHh0KHRoaXMueCk7XG5cdFx0bGV0IHR5ID0geXQodGhpcy55KTtcblx0XHRsZXQgdFdpZHRoID0geHQodGhpcy53aWR0aCk7XG5cdFx0bGV0IHRIZWlnaHQgPSB4dCh0aGlzLmhlaWdodCk7XG5cblx0XHRpZiAodGhpcy5maWxsKSB7XG5cdFx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdFx0Y29udGV4dC5maWxsUmVjdCh0eCwgdHksIHRXaWR0aCwgdEhlaWdodCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2V0TGluZU1vZGUoY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LnN0cm9rZVJlY3QodHgsIHR5LCB0V2lkdGgsIHRIZWlnaHQpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7XG4iLCJjb25zdCBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0Jyk7XG5cbmNsYXNzIFJlY3RDIGV4dGVuZHMgUmVjdCB7XG5cdC8vIHRvZG8gW2xvd10gcmVmYWN0b3IgY29vcmRpbmF0ZSBzeXN0ZW0gdG8gc3VwcG9ydCBjb29yZGludGFlcywgY2VudGVyZWQgY29vcmRpbnRhZXMsIGFuZCBjYW1lcmEgY29vcmRpbnRhZXMgdG8gcmVwbGFjZSBjdXJyZW50IGNvbnN0cnVjdG9yIG92ZXJsb2FkaW5nXG5cdGNvbnN0cnVjdG9yKGNlbnRlclgsIGNlbnRlclksIHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0c3VwZXIoY2VudGVyWCAtIHdpZHRoIC8gMiwgY2VudGVyWSAtIGhlaWdodCAvIDIsIHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSk7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIGNlbnRlclgsIGNlbnRlclksIHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0cmV0dXJuIG5ldyBSZWN0QyhjYW1lcmEueHQoY2VudGVyWCksIGNhbWVyYS55dChjZW50ZXJZKSwgY2FtZXJhLnN0KHdpZHRoKSwgY2FtZXJhLnN0KGhlaWdodCksIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWN0QztcbiIsImNvbnN0IFBhaW50ZXJFbGVtZW50ID0gcmVxdWlyZSgnLi9QYWludGVyRWxlbWVudCcpO1xuXG5jbGFzcyBUZXh0IGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB0ZXh0LCB7Y29sb3IgPSAnIzAwMCd9ID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLnRleHQgPSB0ZXh0O1xuXHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0fVxuXG5cdHBhaW50KHh0LCB5dCwgY29udGV4dCkge1xuXHRcdGxldCB0eCA9IHh0KHRoaXMueCk7XG5cdFx0bGV0IHR5ID0geXQodGhpcy55KTtcblx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdGNvbnRleHQuZmlsbFRleHQodGhpcy50ZXh0LCB0eCwgdHkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dDtcbiIsImNvbnN0IHtVaUNzfSA9IHJlcXVpcmUoJy4uL3V0aWwvVWlDb25zdGFudHMnKTtcbmNvbnN0IHtyYW5kLCByYW5kSW50fSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY29uc3QgRkxJQ0tFUl9DT0xPUl9NVUxUID0gLjc7XG5jb25zdCBTVEFSX0NPTE9SX0FSUkFZID0gW1xuXHRbVWlDcy5TdGFyLldISVRFLCBVaUNzLlN0YXIuV0hJVEUubXVsdGlwbHkoRkxJQ0tFUl9DT0xPUl9NVUxUKV0sXG5cdFtVaUNzLlN0YXIuQkxVRSwgVWlDcy5TdGFyLkJMVUUubXVsdGlwbHkoRkxJQ0tFUl9DT0xPUl9NVUxUKV1dO1xuXG5jbGFzcyBTdGFyIHtcblx0Y29uc3RydWN0b3IoeCwgeSwgeiwgc2l6ZSwgYmx1ZSkge1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLnogPSB6O1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5ibHVlID0gYmx1ZTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdGNvbnN0IEZMSUNLRVJfUkFURSA9IC4wMDM7XG5cblx0XHRsZXQgeCA9IGNhbWVyYS54dCh0aGlzLngsIHRoaXMueik7XG5cdFx0bGV0IHkgPSBjYW1lcmEueXQodGhpcy55LCB0aGlzLnopO1xuXHRcdGxldCBzID0gY2FtZXJhLnN0KHRoaXMuc2l6ZSwgdGhpcy56KTtcblxuXHRcdGlmICh0aGlzLmZsaWNrZXIpXG5cdFx0XHR0aGlzLmZsaWNrZXItLTtcblx0XHRlbHNlIGlmIChyYW5kKCkgPCBGTElDS0VSX1JBVEUpXG5cdFx0XHR0aGlzLmZsaWNrZXIgPSByYW5kSW50KDc1KTtcblxuXHRcdGxldCBjb2xvciA9IFNUQVJfQ09MT1JfQVJSQVlbdGhpcy5ibHVlID8gMSA6IDBdW3RoaXMuZmxpY2tlciA/IDEgOiAwXTtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdEMoeCwgeSwgcywgcywge2ZpbGw6IHRydWUsIGNvbG9yOiBjb2xvci5nZXQoKX0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXI7XG4iLCJjb25zdCB7cmFuZCwgcmFuZEJ9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IFN0YXIgPSByZXF1aXJlKCcuL1N0YXInKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBTdGFyZmllbGQge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBleHRyYSA9IDApIHtcblx0XHRjb25zdCBERVBUSCA9IDIwICsgZXh0cmEgKiAyMCwgRk9SV0FSRF9ERVBUSCA9IC44LFxuXHRcdFx0V0lEVEggPSB3aWR0aCAqIERFUFRILCBIRUlHSFQgPSBoZWlnaHQgKiBERVBUSCxcblx0XHRcdENPVU5UID0gMTAgKiBXSURUSCAqIEhFSUdIVCxcblx0XHRcdFNJWkUgPSAuMDMgKyBleHRyYSAqIC4wMywgQkxVRV9SQVRFID0gLjA1O1xuXG5cdFx0dGhpcy5zdGFycyA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgQ09VTlQ7IGkrKykge1xuXHRcdFx0bGV0IHggPSByYW5kQihXSURUSCk7XG5cdFx0XHRsZXQgeSA9IHJhbmRCKEhFSUdIVCk7XG5cdFx0XHRsZXQgeiA9IHJhbmQoREVQVEgpIC0gRk9SV0FSRF9ERVBUSDtcblx0XHRcdGlmICh4ID4geiB8fCB4IDwgLXogfHwgeSA+IHogfHwgeSA8IC16KVxuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdGxldCBzaXplID0gcmFuZChTSVpFKTtcblx0XHRcdHRoaXMuc3RhcnMucHVzaChuZXcgU3Rhcih4LCB5LCB6LCBzaXplLCByYW5kKCkgPCBCTFVFX1JBVEUpKTtcblx0XHR9XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHQvLyBwYWludGVyLmFkZChuZXcgUmVjdEMoLjUsIC41LCAxLCAxLCB7ZmlsbDogdHJ1ZX0pKTtcblx0XHR0aGlzLnN0YXJzLmZvckVhY2goc3RhciA9PiBzdGFyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhcmZpZWxkO1xuIiwiY29uc3QgU3RhcmZpZWxkID0gcmVxdWlyZSgnLi9TdGFyZmllbGQnKTtcbmNvbnN0IHtOb2lzZVNpbXBsZXh9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xuY29uc3Qge3JhbmR9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IFN0YXIgPSByZXF1aXJlKCcuL1N0YXInKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuXG4vLyB0aGlzIGNsYXNzIGlzIG9ubHkgZm9yIHRoZSBTdGFyZmllbGREZW1vXG5jbGFzcyBTdGFyZmllbGROb2lzZSBleHRlbmRzIFN0YXJmaWVsZCB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGV4dHJhID0gMCkge1xuXHRcdHN1cGVyKDAsIDAsIDApO1xuXG5cdFx0Y29uc3QgREVQVEggPSAyMCArIGV4dHJhICogMjAsIEZPUldBUkRfREVQVEggPSAuOCxcblx0XHRcdFdJRFRIID0gd2lkdGggKiBERVBUSCwgSEVJR0hUID0gaGVpZ2h0ICogREVQVEgsXG5cdFx0XHRDT1VOVCA9IDEwICogV0lEVEggKiBIRUlHSFQsXG5cdFx0XHRTSVpFID0gLjAzICsgZXh0cmEgKiAuMDMsIEJMVUVfUkFURSA9IC4wNTtcblxuXHRcdGxldCBub2lzZSA9IG5ldyBOb2lzZVNpbXBsZXgoOCk7XG5cblx0XHR0aGlzLnN0YXJzID0gbm9pc2UucG9zaXRpb25zKENPVU5ULCBXSURUSCwgSEVJR0hUKS5tYXAoKFt4LCB5XSkgPT4ge1xuXHRcdFx0eCAtPSBXSURUSCAvIDI7XG5cdFx0XHR5IC09IEhFSUdIVCAvIDI7XG5cdFx0XHRsZXQgeiA9IHJhbmQoREVQVEgpO1xuXHRcdFx0aWYgKHggPiB6IHx8IHggPCAteiB8fCB5ID4geiB8fCB5IDwgLXopXG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0bGV0IHNpemUgPSByYW5kKFNJWkUpO1xuXHRcdFx0cmV0dXJuIG5ldyBTdGFyKHgsIHksIHosIHNpemUsIHJhbmQoKSA8IEJMVUVfUkFURSk7XG5cdFx0fSkuZmlsdGVyKHN0YXIgPT4gc3Rhcik7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyZmllbGROb2lzZTtcbiIsImNvbnN0IHtjbGFtcH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xuXG5jb25zdCBTSEFERV9BREQgPSAxO1xuXG5jbGFzcyBDb2xvciB7XG5cdGNvbnN0cnVjdG9yKHIsIGcsIGIsIGEgPSAxKSB7XG5cdFx0dGhpcy5yID0gY2xhbXAociwgMCwgMjU1KTtcblx0XHR0aGlzLmcgPSBjbGFtcChnLCAwLCAyNTUpO1xuXHRcdHRoaXMuYiA9IGNsYW1wKGIsIDAsIDI1NSk7XG5cdFx0dGhpcy5hID0gY2xhbXAoYSwgMCwgMSk7XG5cdFx0dGhpcy5zdHJpbmcgPSBgcmdiYSgke3RoaXMucn0sICR7dGhpcy5nfSwgJHt0aGlzLmJ9LCAke3RoaXMuYX0pYDtcblx0fVxuXG5cdHN0YXRpYyBmcm9tMjU1KHIsIGcsIGIsIGEpIHtcblx0XHRyZXR1cm4gbmV3IENvbG9yKHIsIGcsIGIsIGEpO1xuXHR9XG5cblx0c3RhdGljIGZyb20xKHIxLCBnMSwgYjEsIGEpIHtcblx0XHRyZXR1cm4gbmV3IENvbG9yKC4uLltyMSwgZzEsIGIxXS5tYXAoQ29sb3Iub25lVG8yNTUpLCBhKTtcblx0fVxuXG5cdHN0YXRpYyBmcm9tSGV4KHJoLCBnaCwgYmgsIGEpIHtcblx0XHRyZXR1cm4gbmV3IENvbG9yKC4uLltyaCwgZ2gsIGJoXS5tYXAoQ29sb3IuaGV4VG8yNTUpLCBhKVxuXHR9XG5cblx0c3RhdGljIGZyb21IZXhTdHJpbmcoaGV4KSB7XG5cdFx0aWYgKGhleFswXSA9PT0gJyMnKVxuXHRcdFx0aGV4ID0gaGV4LnN1YnN0cigxKTtcblxuXHRcdGlmIChoZXgubGVuZ3RoID09PSAzKVxuXHRcdFx0cmV0dXJuIENvbG9yLmZyb20yNTUoXG5cdFx0XHRcdENvbG9yLmhleFRvMjU1KHBhcnNlSW50KGhleFswXSwgMTYpKSxcblx0XHRcdFx0Q29sb3IuaGV4VG8yNTUocGFyc2VJbnQoaGV4WzFdLCAxNikpLFxuXHRcdFx0XHRDb2xvci5oZXhUbzI1NShwYXJzZUludChoZXhbMl0sIDE2KSkpO1xuXG5cdFx0cmV0dXJuIENvbG9yLmZyb20yNTUoXG5cdFx0XHRwYXJzZUludChoZXguc3Vic3RyKDAsIDIpLCAxNiksXG5cdFx0XHRwYXJzZUludChoZXguc3Vic3RyKDIsIDIpLCAxNiksXG5cdFx0XHRwYXJzZUludChoZXguc3Vic3RyKDQsIDIpLCAxNikpO1xuXHR9XG5cblx0bXVsdGlwbHkobXVsdCkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IodGhpcy5yICogbXVsdCwgdGhpcy5nICogbXVsdCwgdGhpcy5iICogbXVsdCwgdGhpcy5hKTtcblx0fVxuXG5cdGFscGhhTXVsdGlwbHkobXVsdCkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IodGhpcy5yLCB0aGlzLmcsIHRoaXMuYiwgdGhpcy5hICogbXVsdCk7XG5cdH1cblxuXHRnZXQoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc3RyaW5nO1xuXHR9XG5cblx0Ly8gc2hhZGUgc2hvdWxkIGJlIDAgKG5vIHNoYWRpbmcpIHRvIDEgKG1heGltdW0gc2hhZGluZylcblx0Z2V0U2hhZGUoc2hhZGUgPSAxKSB7XG5cdFx0aWYgKHNoYWRlID09PSAxKVxuXHRcdFx0cmV0dXJuIHRoaXMuc2hhZGVTdHJpbmcgfHwgKHRoaXMuc2hhZGVTdHJpbmcgPSB0aGlzLm11bHRpcGx5KDEgKyBTSEFERV9BREQpLmdldCgpKTtcblx0XHRyZXR1cm4gdGhpcy5tdWx0aXBseSgxICsgU0hBREVfQUREICogc2hhZGUpLmdldCgpO1xuXHR9XG5cblx0Z2V0QWxwaGEoYWxwaGFNdWx0ID0gMSkge1xuXHRcdGNvbnN0IE5PX0NPTE9SID0gQ29sb3IuZnJvbTEoMCwgMCwgMCwgMCk7XG5cdFx0aWYgKGFscGhhTXVsdCA9PT0gMSlcblx0XHRcdHJldHVybiB0aGlzLnN0cmluZztcblx0XHRpZiAoYWxwaGFNdWx0ID09PSAwKVxuXHRcdFx0cmV0dXJuIE5PX0NPTE9SLmdldCgpO1xuXHRcdHJldHVybiB0aGlzLmFscGhhTXVsdGlwbHkoYWxwaGFNdWx0KS5nZXQoKTtcblx0fVxuXG5cdHN0YXRpYyBoZXhUbzI1NShoZXgpIHtcblx0XHRyZXR1cm4gaGV4ICogMTdcblx0fVxuXG5cdHN0YXRpYyBvbmVUbzI1NShvbmUpIHtcblx0XHRyZXR1cm4gcGFyc2VJbnQob25lICogMjU1KTtcblx0fVxufVxuXG5Db2xvci5XSElURSA9IENvbG9yLmZyb20xKDAsIDAsIDApO1xuQ29sb3IuQkxBQ0sgPSBDb2xvci5mcm9tMSgwLCAwLCAwKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvcjtcbiIsImNsYXNzIERlY2F5IHtcblx0Y29uc3RydWN0b3IobWF4LCBkZWNheVJhdGUpIHtcblx0XHR0aGlzLm1heCA9IG1heDtcblx0XHR0aGlzLmRlY2F5UmF0ZSA9IGRlY2F5UmF0ZTtcblx0XHR0aGlzLnZhbHVlID0gMDtcblx0fVxuXG5cdGFkZChhbW91bnQpIHtcblx0XHRpZiAoYW1vdW50ID4gMClcblx0XHRcdHRoaXMudmFsdWUgPSBNYXRoLm1pbih0aGlzLnZhbHVlICsgYW1vdW50LCB0aGlzLm1heCArIHRoaXMuZGVjYXlSYXRlKTtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRpZiAodGhpcy52YWx1ZSA+IDApXG5cdFx0XHR0aGlzLnZhbHVlID0gTWF0aC5tYXgodGhpcy52YWx1ZSAtIHRoaXMuZGVjYXlSYXRlLCAwKTtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSAvIHRoaXMubWF4O1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGVjYXk7XG4iLCJjb25zdCBtYWtlRW51bSA9ICguLi52YWx1ZXMpID0+IHtcblx0bGV0IGVudW1iID0ge307XG5cdHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSwgaW5kZXgpID0+IGVudW1iW3ZhbHVlXSA9IGluZGV4KTtcblx0cmV0dXJuIGVudW1iO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYWtlRW51bTtcbiIsImNsYXNzIEl0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwcmV2KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5wcmV2ID0gcHJldjtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsImNvbnN0IEl0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxuY2xhc3MgTGlua2VkTGlzdCB7XG5cdGFkZCh2YWx1ZSkge1xuXHRcdHJldHVybiAhdGhpcy5oZWFkXG5cdFx0XHQ/IHRoaXMudGFpbCA9IHRoaXMuaGVhZCA9IG5ldyBJdGVtKHZhbHVlKVxuXHRcdFx0OiB0aGlzLnRhaWwgPSB0aGlzLnRhaWwubmV4dCA9IG5ldyBJdGVtKHZhbHVlLCB0aGlzLnRhaWwpO1xuXHR9XG5cblx0cmVtb3ZlKGl0ZW0pIHtcblx0XHRpZiAoaXRlbS5wcmV2KVxuXHRcdFx0aXRlbS5wcmV2Lm5leHQgPSBpdGVtLm5leHQ7XG5cdFx0aWYgKGl0ZW0ubmV4dClcblx0XHRcdGl0ZW0ubmV4dC5wcmV2ID0gaXRlbS5wcmV2O1xuXHRcdGlmICh0aGlzLmhlYWQgPT09IGl0ZW0pXG5cdFx0XHR0aGlzLmhlYWQgPSBpdGVtLm5leHQ7XG5cdFx0aWYgKHRoaXMudGFpbCA9PT0gaXRlbSlcblx0XHRcdHRoaXMudGFpbCA9IGl0ZW0ucHJldjtcblx0fVxuXG5cdGZvckVhY2goaGFuZGxlcikge1xuXHRcdGxldCBpdGVyID0gdGhpcy5oZWFkO1xuXHRcdHdoaWxlIChpdGVyKSB7XG5cdFx0XHRoYW5kbGVyKGl0ZXIudmFsdWUsIGl0ZXIpO1xuXHRcdFx0aXRlciA9IGl0ZXIubmV4dDtcblx0XHR9XG5cdH1cblxuXHRmaW5kKGhhbmRsZXIpIHtcblx0XHRsZXQgaXRlciA9IHRoaXMuaGVhZDtcblx0XHR3aGlsZSAoaXRlcikge1xuXHRcdFx0aWYgKGhhbmRsZXIoaXRlci52YWx1ZSwgaXRlcikpXG5cdFx0XHRcdHJldHVybiBpdGVyO1xuXHRcdFx0aXRlciA9IGl0ZXIubmV4dDtcblx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaW5rZWRMaXN0O1xuIiwiY29uc3QgU2ltcGxleE5vaXNlID0gcmVxdWlyZSgnc2ltcGxleC1ub2lzZScpO1xuXG5jb25zdCB7RVBTSUxPTiwgZ2V0TWFnbml0dWRlLCByYW5kfSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNsYXNzIE5vaXNlU2ltcGxleCB7XG5cdGNvbnN0cnVjdG9yKHNjYWxlID0gMTAsIHRocmVzaG9sZCA9IC41LCB0aHJlc2hvbGRSYW5kV2VpZ2h0ID0gMSkge1xuXHRcdHRoaXMuc2NhbGUgPSBzY2FsZTtcblx0XHR0aGlzLnRocmVzaG9sZCA9IHRocmVzaG9sZDtcblx0XHR0aGlzLnRocmVzaG9sZFJhbmRXZWlnaHQgPSB0aHJlc2hvbGRSYW5kV2VpZ2h0O1xuXHRcdHRoaXMuc2ltcGxleE5vaXNlID0gbmV3IFNpbXBsZXhOb2lzZShyYW5kKTtcblx0fVxuXG5cdGdldCh4LCB5KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2ltcGxleE5vaXNlLm5vaXNlMkQoeCAqIHRoaXMuc2NhbGUgKyAxLCB5ICogdGhpcy5zY2FsZSkgKiAuNSArIC41OyAvLyBzZWVtcyBsaWtlIHNpbXBsZXhOb2lzZSBpbXBsZW1lbnRhdGlvbiBpcyBidWdnZWQgdG8gYWx3YXlzIHJldHVybiAwIGF0ICgwLCAwKVxuXHR9XG5cblx0Ly8gbm90IGNvbnNpc3RlbnQsIGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMgd2l0aCBzYW1lIHBhcmFtdGVycyBjYW4geWllbGQgZGlmZmVyZW50IHJlc3VsdHNcblx0Z2V0Qih4LCB5KSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0KHgsIHkpID4gdGhpcy50aHJlc2hvbGQgKyByYW5kKHRoaXMudGhyZXNob2xkUmFuZFdlaWdodCk7XG5cdH1cblxuXHQvLyByZXR1cm4gY291bnQgbnVtYmVyIG9mIHBvc2l0aW9ucyB3aXRoaW4gcmFuZ2UgW1swIC0gd2lkdGhdLCBbMCAtIGhlaWdodF1dLCBzdHJ1Y3R1cmVkIGFzIDJkIGFycmF5XG5cdC8vIG5vdCBjb25zaXN0ZW50LCBjYWxsaW5nIGl0IG11bHRpcGxlIHRpbWVzIHdpdGggc2FtZSBwYXJhbXRlcnMgY2FuIHlpZWxkIGRpZmZlcmVudCByZXN1bHRzXG5cdHBvc2l0aW9ucyhjb3VudCwgd2lkdGgsIGhlaWdodCkge1xuXHRcdGxldCBwb3NpdGlvbnMgPSBbXTtcblx0XHR3aGlsZSAocG9zaXRpb25zLmxlbmd0aCA8IGNvdW50KSB7XG5cdFx0XHRsZXQgeCA9IHJhbmQoKTtcblx0XHRcdGxldCB5ID0gcmFuZCgpO1xuXHRcdFx0aWYgKHRoaXMuZ2V0Qih4LCB5KSlcblx0XHRcdFx0cG9zaXRpb25zLnB1c2goW3ggKiB3aWR0aCwgeSAqIGhlaWdodF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcG9zaXRpb25zO1xuXHR9XG5cblx0Ly8gcmV0dXJuIHBvc2l0aW9uIHdpdGggbG93ZXN0IG5vaXNlIHZhbHVlIG9mIGNvdW50IHJhbmRvbSBwb3NpdGlvbnMsIHdpdGhpbiByYW5nZSBbWzAgLSB3aWR0aF0sIFswIC0gaGVpZ2h0XV1cblx0Ly8gbm90IGNvbnNpc3RlbnQsIGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMgd2l0aCBzYW1lIHBhcmFtdGVycyBjYW4geWllbGQgZGlmZmVyZW50IHJlc3VsdHNcblx0cG9zaXRpb25zTG93ZXN0KGNvdW50LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0bGV0IHBvc2l0aW9uID0gW107XG5cdFx0bGV0IG1pbk5vaXNlID0gMTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0XHRcdGxldCB4ID0gcmFuZCgpO1xuXHRcdFx0bGV0IHkgPSByYW5kKCk7XG5cdFx0XHRsZXQgbm9pc2UgPSB0aGlzLmdldCh4LCB5KTtcblx0XHRcdGlmIChub2lzZSA8IG1pbk5vaXNlKSB7XG5cdFx0XHRcdG1pbk5vaXNlID0gbm9pc2U7XG5cdFx0XHRcdHBvc2l0aW9uID0gW3ggKiB3aWR0aCwgeSAqIGhlaWdodF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBwb3NpdGlvbjtcblx0fVxuXG59XG5cbmNsYXNzIE5vaXNlR3JhZGllbnQge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnBvaW50cyA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgMTAwMDsgaSsrKVxuXHRcdFx0dGhpcy5wb2ludHMucHVzaChbcmFuZCgpLCByYW5kKCksIHJhbmQoKV0pO1xuXHR9XG5cblx0Z2V0KHgsIHkpIHtcblx0XHRsZXQgd2VpZ2h0ID0gMDtcblx0XHRsZXQgeiA9IDA7XG5cdFx0dGhpcy5wb2ludHMuZm9yRWFjaCgoW3B4LCBweSwgcHpdKSA9PiB7XG5cdFx0XHRsZXQgZCA9IGdldE1hZ25pdHVkZShweCAtIHgsIHB5IC0geSk7XG5cdFx0XHRkID0gMSAvIChkICsgRVBTSUxPTik7XG5cdFx0XHR3ZWlnaHQgKz0gZDtcblx0XHRcdHogKz0gcHogKiBkO1xuXHRcdH0pO1xuXHRcdHJldHVybiB6IC8gd2VpZ2h0O1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge05vaXNlU2ltcGxleCwgTm9pc2VHcmFkaWVudH07XG4iLCJjb25zdCBFUFNJTE9OID0gMWUtMTAsIFBJID0gTWF0aC5QSSwgUEkyID0gUEkgKiAyO1xuXG5jb25zdCBtYXhXaGljaCA9IChpLCBqKSA9PiBpID4gaiA/IFtpLCAwXSA6IFtqLCAxXTtcblxuY29uc3QgZ2V0RGlhbW9uZERpc3RhbmNlID0gKHgsIHkpID0+IE1hdGguYWJzKHgpICsgTWF0aC5hYnMoeSk7XG5cbmNvbnN0IGdldFJlY3REaXN0YW5jZSA9ICh4LCB5KSA9PiBNYXRoLm1heChNYXRoLmFicyh4KSwgTWF0aC5hYnMoeSkpO1xuXG5jb25zdCBnZXRNYWduaXR1ZGUgPSAoeCwgeSkgPT5cblx0TWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpO1xuXG5jb25zdCBzZXRNYWduaXR1ZGUgPSAoeCwgeSwgbWFnbml0dWRlID0gMSkgPT4ge1xuXHRsZXQgcHJldk1hZ25pdHVkZSA9IGdldE1hZ25pdHVkZSh4LCB5KTtcblx0aWYgKCFwcmV2TWFnbml0dWRlKVxuXHRcdHJldHVybiB7eDogbWFnbml0dWRlLCB5OiAwLCBwcmV2TWFnbml0dWRlfTtcblx0bGV0IG11bHQgPSBtYWduaXR1ZGUgLyBwcmV2TWFnbml0dWRlO1xuXHRyZXR1cm4ge3g6IHggKiBtdWx0LCB5OiB5ICogbXVsdCwgcHJldk1hZ25pdHVkZX07XG59O1xuXG5jb25zdCBjbGFtcCA9ICh4LCBtaW4sIG1heCkgPT4ge1xuXHRpZiAoeCA8IG1pbilcblx0XHRyZXR1cm4gbWluO1xuXHRyZXR1cm4geCA+IG1heCA/IG1heCA6IHg7XG59O1xuXG5jb25zdCB0aGV0YVRvVmVjdG9yID0gKHRoZXRhLCBtYWduaXR1ZGUgPSAxKSA9PiBbY29zKHRoZXRhKSAqIG1hZ25pdHVkZSwgc2luKHRoZXRhKSAqIG1hZ25pdHVkZV07XG5cbmNvbnN0IGNvcyA9IHRoZXRhID0+IE1hdGguY29zKHRoZXRhKTtcblxuY29uc3Qgc2luID0gdGhldGEgPT4gTWF0aC5zaW4odGhldGEpO1xuXG5jb25zdCBib29sZWFuQXJyYXkgPSBhcnJheSA9PiBhcnJheS5zb21lKGEgPT4gYSk7XG5cbmNvbnN0IGF2ZyA9IChhLCBiLCB3ZWlnaHQgPSAuNSkgPT4gYSAqIHdlaWdodCArIGIgKiAoMSAtIHdlaWdodCk7XG5cbmNvbnN0IHJhbmQgPSAobWF4ID0gMSkgPT4gTWF0aC5yYW5kb20oKSAqIG1heDtcblxuY29uc3QgcmFuZEIgPSAobWF4ID0gMSkgPT4gcmFuZChtYXgpIC0gbWF4IC8gMjtcblxuY29uc3QgcmFuZEludCA9IG1heCA9PiBwYXJzZUludChyYW5kKG1heCkpO1xuXG5jb25zdCByYW5kVmVjdG9yID0gbWFnbml0dWRlID0+XG5cdHRoZXRhVG9WZWN0b3IocmFuZChQSTIpLCByYW5kKG1hZ25pdHVkZSkpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtFUFNJTE9OLCBQSSwgUEkyLCBtYXhXaGljaCwgZ2V0RGlhbW9uZERpc3RhbmNlLCBnZXRSZWN0RGlzdGFuY2UsIGdldE1hZ25pdHVkZSwgc2V0TWFnbml0dWRlLCBjbGFtcCwgdGhldGFUb1ZlY3RvciwgY29zLCBzaW4sIGJvb2xlYW5BcnJheSwgYXZnLCByYW5kLCByYW5kQiwgcmFuZEludCwgcmFuZFZlY3Rvcn07XG4iLCJjb25zdCB7cmFuZEludH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xuXG5jbGFzcyBQaGFzZSB7XG5cdC8vIGR1cmF0aW9ucyBzaG91bGQgYmUgPj0gMFxuXHRjb25zdHJ1Y3RvciguLi5kdXJhdGlvbnMpIHtcblx0XHR0aGlzLmR1cmF0aW9ucyA9IGR1cmF0aW9ucztcblx0XHR0aGlzLnNldFNlcXVlbnRpYWxTdGFydFBoYXNlKDApO1xuXHRcdHRoaXMuc2V0UGhhc2UoMCk7XG5cdH1cblxuXHRzZXRTZXF1ZW50aWFsU3RhcnRQaGFzZShwaGFzZSkge1xuXHRcdHRoaXMuc2VxdWVudGlhbFN0YXJ0UGhhc2UgPSBwaGFzZTtcblx0fVxuXG5cdHNldFBoYXNlKHBoYXNlKSB7XG5cdFx0dGhpcy5waGFzZSA9IHBoYXNlO1xuXHRcdHRoaXMuZHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uc1twaGFzZV07XG5cdH1cblxuXHRzZXRSYW5kb21UaWNrKCkge1xuXHRcdHRoaXMuZHVyYXRpb24gPSByYW5kSW50KHRoaXMuZHVyYXRpb25zW3RoaXMucGhhc2VdKSArIDE7XG5cdH1cblxuXHRuZXh0UGhhc2UoKSB7XG5cdFx0dGhpcy5zZXRQaGFzZSgrK3RoaXMucGhhc2UgPCB0aGlzLmR1cmF0aW9ucy5sZW5ndGggPyB0aGlzLnBoYXNlIDogdGhpcy5zZXF1ZW50aWFsU3RhcnRQaGFzZSk7XG5cdH1cblxuXHQvLyByZXR1cm4gdHJ1ZSBpZiBwaGFzZSBlbmRzIChlLmcuLCBkdXJhdGlvbiBlcXVhbGVkIDEpXG5cdHRpY2soKSB7XG5cdFx0cmV0dXJuIHRoaXMuZHVyYXRpb24gJiYgIS0tdGhpcy5kdXJhdGlvbjtcblx0fVxuXG5cdC8vIHJldHVybiB0cnVlIGlmIHBoYXNlIGVuZHMgKHNlZSB0aWNrKCkpXG5cdC8vIGlmIHRpY2sgPSAwLCB3aWxsIHJlbWFpbiAwIGFuZCBwaGFzZSB3aWxsIG5vdCBpdGVyYXRlXG5cdHNlcXVlbnRpYWxUaWNrKCkge1xuXHRcdGlmICh0aGlzLnRpY2soKSkge1xuXHRcdFx0dGhpcy5uZXh0UGhhc2UoKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdGlzTmV3KCkge1xuXHRcdHJldHVybiB0aGlzLmR1cmF0aW9uID09PSB0aGlzLmR1cmF0aW9uc1t0aGlzLnBoYXNlXTtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRyZXR1cm4gdGhpcy5waGFzZTtcblx0fVxuXG5cdC8vIHN0YXJ0cyBhdCAwLCBpbmNyZWFzZXMgdG8gMVxuXHRnZXRSYXRpbygpIHtcblx0XHRyZXR1cm4gMSAtIHRoaXMuZHVyYXRpb24gLyB0aGlzLmR1cmF0aW9uc1t0aGlzLnBoYXNlXTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBoYXNlO1xuIiwiY29uc3Qge2NsYW1wfSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNsYXNzIFBvb2wge1xuXHRjb25zdHJ1Y3RvcihtYXgsIGluY3JlbWVudFJhdGUgPSAwKSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMubWF4ID0gbWF4O1xuXHRcdHRoaXMuaW5jcmVtZW50UmF0ZSA9IGluY3JlbWVudFJhdGU7XG5cdH1cblxuXHQvLyByZXR1cm4gdHJ1ZSBpZiByZWFjaGVkIDAgb3IgbWF4XG5cdGluY3JlbWVudCgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2UodGhpcy5pbmNyZW1lbnRSYXRlKTtcblx0fVxuXG5cdHJlc3RvcmUoKSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMubWF4O1xuXHR9XG5cblx0Ly8gcmV0dXJuIHRydWUgaWYgcmVhY2hlZCAwIG9yIG1heFxuXHRjaGFuZ2UoYW1vdW50KSB7XG5cdFx0dGhpcy52YWx1ZSA9IGNsYW1wKHRoaXMudmFsdWUgKyBhbW91bnQsIDAsIHRoaXMubWF4KTtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSA9PT0gMCB8fCB0aGlzLnZhbHVlID09PSB0aGlzLm1heDtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZTtcblx0fVxuXG5cdGdldE1heCgpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXg7XG5cdH1cblxuXHRnZXRNaXNzaW5nKCkge1xuXHRcdHJldHVybiB0aGlzLm1heCAtIHRoaXMudmFsdWU7XG5cdH1cblxuXHRnZXRSYXRpbygpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSAvIHRoaXMubWF4O1xuXHR9XG5cblx0Z2V0TWlzc2luZ1JhdGlvKCkge1xuXHRcdHJldHVybiB0aGlzLmdldE1pc3NpbmcoKSAvIHRoaXMubWF4O1xuXHR9XG5cblx0aXNGdWxsKCkge1xuXHRcdHJldHVybiB0aGlzLnZhbHVlID09PSB0aGlzLm1heDtcblx0fVxuXG5cdGlzRW1wdHkoKSB7XG5cdFx0cmV0dXJuICF0aGlzLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsImNsYXNzIFRyaWdnZXIge1xuXHRjb25zdHJ1Y3Rvcih0cmlnZ2VyVmFsdWUpIHtcblx0XHR0aGlzLnRyaWdnZXJWYWx1ZSA9IHRyaWdnZXJWYWx1ZTtcblx0fVxuXG5cdHRyaWdnZXIodmFsdWUpIHtcblx0XHRpZiAoIXRoaXMudHJpZ2dlcmVkICYmIHZhbHVlID09PSB0aGlzLnRyaWdnZXJWYWx1ZSlcblx0XHRcdHJldHVybiB0aGlzLnRyaWdnZXJlZCA9IHRydWU7XG5cdH1cblxuXHR1bnRyaWdnZXIoKSB7XG5cdFx0dGhpcy50cmlnZ2VyZWQgPSBmYWxzZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyaWdnZXI7XG4iLCJjb25zdCBDb2xvciA9IHJlcXVpcmUoJy4vQ29sb3InKTtcblxuY29uc3QgQ29sb3JzID0ge1xuXHQvLyB0b2RvIFttZWRpdW1dIHN0cnVjdHVyZSB0aGVzZSBjb25zdGFudHNcblxuXHQvLyBiYXJzXG5cdEJBUl9TSEFESU5HOiAuMjUsXG5cdExJRkU6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNmYWI5YjEnKSxcblx0U1RBTUlOQTogQ29sb3IuZnJvbUhleFN0cmluZygnIzk4ZDQ5NCcpLFxuXHRFTlJBR0U6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM2MTY2MDAnKSxcblxuXHRUQVJHRVRfTE9DSzogQ29sb3IuZnJvbTEoLjUsIC41LCAuNSksXG5cdERBTUFHRTogQ29sb3IuZnJvbTI1NSgyNTUsIDAsIDAsIC40KSxcblxuXHQvLyBhYmlsaXRpZXNcblx0QkFTSUNfQVRUQUNLOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjYTg3Njc2JyksXG5cdERBU0g6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM3NmE4NzYnKSxcblx0SEVBTDogQ29sb3IuZnJvbUhleFN0cmluZygnIzc2NzZhOCcpLFxuXHROT1RfUkVBRFk6IENvbG9yLmZyb21IZXgoJyM4ODgnKSwgLy8gdG9kbyBbaGlnaF0gbWFrZSB2aXNpYmxlIGNvbG9yIG9uIHdoaXRlIGJnXG5cblx0SW50ZXJmYWNlOiB7XG5cdFx0SU5BQ1RJVkU6IENvbG9yLmZyb20xKDEsIDEsIDEpLFxuXHRcdEhPVkVSOiBDb2xvci5mcm9tMSguOTUsIC45NSwgLjk1KSxcblx0XHRBQ1RJVkU6IENvbG9yLmZyb20xKDEsIDEsIDEpXG5cdH0sXG5cblx0RW50aXR5OiB7XG5cdFx0Uk9DSzogQ29sb3IuZnJvbUhleFN0cmluZygnIzg4OCcpLFxuXHRcdFBMQVlFUjogQ29sb3IuZnJvbUhleFN0cmluZygnIzg4OCcpLFxuXHRcdE1PTlNURVI6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM4ODgnKSxcblx0XHRQUk9KRUNUSUxFOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjODg4JyksXG5cdFx0RFVTVDogQ29sb3IuZnJvbUhleFN0cmluZygnIzg4OCcpXG5cdH0sXG5cblx0QWJpbGl0eToge1xuXHRcdE5lYXJ5YnlEZWdlbjoge1xuXHRcdFx0V0FSTklOR19CT1JERVI6IENvbG9yLmZyb20xKDEsIDAsIDApLFxuXHRcdFx0QUNUSVZFX0ZJTEw6IENvbG9yLmZyb20xKC44LCAwLCAwLCAuMSlcblx0XHR9XG5cdH0sXG5cblx0U3Rhcjoge1xuXHRcdFdISVRFOiBDb2xvci5XSElURSwgLy8gdG9kbyBbaGlnaF0gd2hpdGUgc2hvdWxkbid0IGJlIHdvcmtpbmcsICYgaXMgYmx1ZSB3b3JraW5nP1xuXHRcdEJMVUU6IENvbG9yLmZyb20xKC44LCAuOCwgMSlcblx0fSxcblxuXHRNaW5pbWFwOiB7XG5cdFx0QkFDS0dST1VORDogQ29sb3IuZnJvbTEoMSwgMSwgMSwgLjUpLFxuXHRcdFJPQ0s6IENvbG9yLmZyb20xKDAsIDAsIDApLFxuXHRcdE1PTlNURVI6IENvbG9yLmZyb20xKDEsIDAsIDApLFxuXHRcdEJPU1M6IENvbG9yLmZyb20xKDAsIDEsIDApLFxuXHRcdFBMQVlFUjogQ29sb3IuZnJvbTEoMCwgMCwgMSlcblx0fVxufTtcblxuY29uc3QgUG9zaXRpb25zID0ge1xuXHRNQVJHSU46IC4wMixcblx0QkFSX0hFSUdIVDogLjAyLFxuXHRQTEFZRVJfQkFSX1g6IC41LFxuXHRBQklMSVRZX1NJWkU6IC4wNixcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1VpQ3M6IENvbG9ycywgVWlQczogUG9zaXRpb25zfTtcblxuLy8gTm90ZXNcblxuLy8gU0hJRUxEX0NPTE9SOiBDb2xvci5mcm9tMSguNCwgLjUsIC43KSxcbi8vIFJFU0VSVkVfQ09MT1I6IENvbG9yLmZyb20xKC4yLCAuNiwgLjYpLFxuLy8gRVhQRVJJRU5DRV9DT0xPUjogQ29sb3IuZnJvbTEoLjksIC42LCAuMSksXG5cbi8vIExJRkVfRU1QVFlfQ09MT1I6IENvbG9yLmZyb21IZXgoMHg0LCAweGIsIDB4YyksXG4vLyBMSUZFX0ZJTExfQ09MT1I6IENvbG9yLmZyb21IZXgoMHg1LCAweGQsIDB4ZiksXG4vLyBTVEFNSU5BX0VNUFRZX0NPTE9SOiBDb2xvci5mcm9tSGV4KDB4YywgMHhjLCAweDQpLFxuLy8gU1RBTUlOQV9GSUxMX0NPTE9SOiBDb2xvci5mcm9tSGV4KDB4ZiwgMHhmLCAweDUpLFxuXG4vLyBjb25zdCBsb2NhbExpZmUgPSBcIiNjYzRlNGVcIjtcbi8vIGNvbnN0IGxvY2FsU3RhbWluYSA9IFwiI2ZmY2M5OVwiO1xuLy8gY29uc3QgbG9jYWxTaGllbGQgPSBcIiM2NjgwYjNcIjtcbi8vIGNvbnN0IGxvY2FsUmVzZXJ2ZSA9IFwiIzMzOTk5OVwiO1xuLy8gY29uc3QgbG9jYWxFeHBlcmllbmNlID0gXCIjZTY5OTFhXCI7XG5cbi8vIGh0dHA6Ly9wYWxldHRvbi5jb20vI3VpZD03NUMwRjBrait6WjlYUnRmdUl2bzB1bHNKcWZcblxuLy8gdG9kbyBbbG93XSBmaW5kIHByZXR0aWVyIGNvbG9yc1xuIiwiY29uc3QgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvQ29udHJvbGxlcicpO1xuY29uc3QgUGFpbnRlciA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUGFpbnRlcicpO1xuY29uc3QgTG9naWMgPSByZXF1aXJlKCcuLi9sb2dpYy9HYW1lJyk7XG5jb25zdCBHcmFwaGljc0RlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9HcmFwaGljc0RlbW8nKTtcbmNvbnN0IFN0YXJmaWVsZERlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9TdGFyZmllbGREZW1vJyk7XG5jb25zdCBOb2lzZURlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9Ob2lzZURlbW8nKTtcbmNvbnN0IE1hcERlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9NYXBEZW1vJyk7XG5jb25zdCBJbnRlcmZhY2VEZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvSW50ZXJmYWNlRGVtbycpO1xuXG5jb25zdCBzbGVlcCA9IG1pbGxpID0+XG5cdG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtaWxsaSkpO1xuXG5jb25zdCBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzJyk7XG5jb25zdCBjb250cm9sbGVyID0gbmV3IENvbnRyb2xsZXIoY2FudmFzKTtcbmNvbnN0IHBhaW50ZXIgPSBuZXcgUGFpbnRlcihjYW52YXMpO1xuXG5jb25zdCBsb2dpYyA9IG5ldyBMb2dpYyhjb250cm9sbGVyLCBwYWludGVyKTtcbi8vIGNvbnN0IGxvZ2ljID0gbmV3IEdyYXBoaWNzRGVtbyhjb250cm9sbGVyLCBwYWludGVyKTtcbi8vIGNvbnN0IGxvZ2ljID0gbmV3IFN0YXJmaWVsZERlbW8oY29udHJvbGxlciwgcGFpbnRlcik7XG4vLyBjb25zdCBsb2dpYyA9IG5ldyBOb2lzZURlbW8oY29udHJvbGxlciwgcGFpbnRlcik7XG4vLyBjb25zdCBsb2dpYyA9IG5ldyBNYXBEZW1vKGNvbnRyb2xsZXIsIHBhaW50ZXIpO1xuLy8gY29uc3QgbG9naWMgPSBuZXcgSW50ZXJmYWNlRGVtbyhjb250cm9sbGVyLCBwYWludGVyKTtcblxubGV0IGxvb3AgPSBhc3luYyAoKSA9PiB7XG5cdHdoaWxlICh0cnVlKSB7XG5cdFx0cGFpbnRlci5jbGVhcigpO1xuXHRcdGxvZ2ljLml0ZXJhdGUoKTtcblx0XHRwYWludGVyLnBhaW50KCk7XG5cdFx0Y29udHJvbGxlci5leHBpcmUoKTtcblx0XHRhd2FpdCBzbGVlcCgxMCk7XG5cdH1cbn07XG5cbmxvb3AoKTtcbiJdfQ==
