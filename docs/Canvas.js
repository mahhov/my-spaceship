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
const Keymapping = require('../control/Keymapping');
const {Colors, Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');
const Bar = require('../painter/Bar');

class Ability {
	constructor(cooldown, charges, stamina, channelStamina, repeatable, channelDuration) {
		this.cooldown = new Pool(cooldown, -1);
		this.charges = new Pool(charges, 1);
		this.stamina = stamina;
		this.channelStamina = channelStamina;
		this.repeatable = repeatable;
		// todo [low] allow indicating whether channel will force stop upon reaching max or will allow to continue
		this.maxChannelDuration = channelDuration; // -1 indicates infinite
		this.channelDuration = 0; // 0 on start, 1... on subsequent calls
	}

	setUi(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		this.uiText = Keymapping.getKeys(Keymapping.Controls.ABILITY_I[uiIndex]).join('/');
	}

	update(origin, direct, map, intersectionFinder, player, wantActive) {
		this.refresh(player);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, player))
			this.channelDuration++;
		else if (this.channelDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, player);
			this.channelDuration = 0;
		}
	}

	refresh(player) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}

		this.ready = !this.charges.isEmpty() && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating);
		this.readyChannelContinue = this.maxChannelDuration && this.channelDuration && player.sufficientStamina(this.channelStamina);
		this.repeating = false;
	}

	safeActivate(origin, direct, map, intersectionFinder, player) {
		this.repeating = true;
		if (!this.ready && !this.readyChannelContinue)
			return false;
		if (!this.activate(origin, direct, map, intersectionFinder, player))
			return false;

		if (this.ready) {
			this.charges.change(-1);
			player.consumeStamina(this.stamina);
		} else {
			player.consumeStamina(this.channelStamina);
			this.cooldown.value = this.cooldown.max;
		}
		return true;
	}

	activate(origin, direct, map, intersectionFinder, player) {
		/* override */
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		/* override */
	}

	get channelRatio() {
		if (this.maxChannelDuration > 0 && this.channelDuration > 0)
			return Math.min(this.channelDuration / this.maxChannelDuration, 1);
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, Positions.ABILITY_SIZE, Positions.ABILITY_SIZE, {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		const ROW_HEIGHT = Positions.ABILITY_SIZE / this.charges.getMax();
		const HEIGHT = this.charges.get() * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT, Positions.ABILITY_SIZE, HEIGHT, {fill: true, color: this.uiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, Positions.ABILITY_SIZE, ROW_HEIGHT, {fill: true, color: this.uiColor.getShade(shade)}));
		}

		// border
		if (!this.ready)
			painter.add(new Rect(LEFT, TOP, Positions.ABILITY_SIZE, Positions.ABILITY_SIZE, {color: Colors.PLAYER_ABILITY_NOT_READY.get(), thickness: 2}));

		// letter
		painter.add(new Text(LEFT + Positions.ABILITY_SIZE / 2, TOP + Positions.ABILITY_SIZE / 2, this.uiText));

		// channel bar
		let channelRatio = this.channelRatio;
		if (channelRatio)
			painter.add(new Bar(LEFT, TOP - Positions.ABILITY_CHANNEL_BAR_SIZE - Positions.MARGIN / 2,
				Positions.ABILITY_SIZE, Positions.ABILITY_CHANNEL_BAR_SIZE, channelRatio,
				this.uiColor.getShade(Colors.BAR_SHADING), this.uiColor.get(), this.uiColor.get()))
	}
}

module.exports = Ability;

},{"../control/Keymapping":13,"../painter/Bar":83,"../painter/Rect":90,"../painter/Text":92,"../util/Constants":97,"../util/Pool":106}],3:[function(require,module,exports){
const Ability = require('./Ability');

class Accelerate extends Ability {
	constructor() {
		super(200, 1, 0, 0, true, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!this.channelDuration) {
			this.buff = this.buff || player.addBuff();
			this.buff.moveSpeed = 3;j
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.moveSpeed = 0;
	}
}

module.exports = Accelerate;

},{"./Ability":2}],4:[function(require,module,exports){
const Ability = require('./Ability');
const {Colors} = require('../util/Constants');
const Bomb = require('../entities/attack/Bomb');

class BombAttack extends Ability {
	constructor(paintUiColumn) {
		super(200, 2, 20, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const SIZE = .05, RANGE = .5, TIME = 100, DAMAGE = 10, MAX_TARGETS = 5;
		let bomb = new Bomb(origin.x, origin.y, SIZE, SIZE, RANGE, TIME, DAMAGE, MAX_TARGETS, true);
		map.addProjectile(bomb);
		return true;
	}
}

module.exports = BombAttack;

},{"../entities/attack/Bomb":23,"../util/Constants":97,"./Ability":2}],5:[function(require,module,exports){
const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ChargedProjectileAttack extends Ability {
	constructor() {
		super(30, 1, 6, .1, false, 60);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (this.channelDuration === 0) {
			this.chargeBuff = this.chargeBuff || player.addBuff();
			this.chargeBuff.moveSpeed = -.5;
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .01, SPREAD = .1, SIZE = .02, TIME = 50, DAMAGE = .1;
		let damage = (1 + this.channelRatio * 3) * DAMAGE;

		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y, SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			TIME, damage, true);
		map.addProjectile(projectile);
		this.chargeBuff.moveSpeed = 0;
	}
}

module.exports = ChargedProjectileAttack;

},{"../entities/attack/Projectile":25,"../util/Number":104,"./Ability":2}],6:[function(require,module,exports){
const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;

		if (!this.channelDuration)   {
			this.buff = this.buff || player.addBuff();
			this.buff.moveSpeed = 1;
			player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.moveSpeed = 0;
	}

}

module.exports = Dash;

},{"../util/Number":104,"./Ability":2}],7:[function(require,module,exports){
const Ability = require('./Ability');
const Pool = require('../util/Pool');

class DelayedRegen extends Ability {
	constructor() {
		super(0, 1, 0, 0, true, 0);
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || player.health.isFull())
			return false;
		player.changeHealth(.0003);
		return true;
	}
}

module.exports = DelayedRegen;

},{"../util/Pool":106,"./Ability":2}],8:[function(require,module,exports){
const Ability = require('./Ability');
const {setMagnitude} = require('../util/Number');

class Heal extends Ability {
	constructor() {
		super(720, 1, 30, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.health.isFull())
			return false;
		player.changeHealth(.1);
		return true;
	}
}

module.exports = Heal;

},{"../util/Number":104,"./Ability":2}],9:[function(require,module,exports){
const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Laser = require('../entities/attack/Laser');

class LaserAttack extends Ability {
	constructor() {
		super(3, 15, .6, 0, true, 0);
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

},{"../entities/attack/Laser":24,"../util/Number":104,"./Ability":2}],10:[function(require,module,exports){
const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor() {
		super(6, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .014, SPREAD = .08, SIZE = .02, TIME = 30, DAMAGE = .1;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, true);
		map.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;

},{"../entities/attack/Projectile":25,"../util/Number":104,"./Ability":2}],11:[function(require,module,exports){
const {clamp, avg} = require('../util/Number');

class Camera {
	constructor(x, y, z = 2) {
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

	zoom(zoomOut, zoomIn) {
		const ZOOM_RATE = .2, MIN_Z = 1, MAX_Z = 10, FILTER_WEIGHT = .93;
		let dz = zoomOut - zoomIn;
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

},{"../util/Number":104}],12:[function(require,module,exports){
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

},{"./State":14}],13:[function(require,module,exports){
const makeEnum = require('../util/Enum');
const Controller = require('./Controller');
const State = require('./State');

const Controls = makeEnum(
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

Controls.ABILITY_I = [
	Controls.ABILITY_1,
	Controls.ABILITY_2,
	Controls.ABILITY_3,
	Controls.ABILITY_4,
	Controls.ABILITY_5,
	Controls.ABILITY_6,
	Controls.ABILITY_7];

let ControlToKeyMap = {
	[Controls.MOVE_LEFT]: ['a'],
	[Controls.MOVE_UP]: ['w'],
	[Controls.MOVE_RIGHT]: ['d'],
	[Controls.MOVE_DOWN]: ['s'],
	[Controls.ABILITY_1]: ['j', '1'],
	[Controls.ABILITY_2]: ['k', '2'],
	[Controls.ABILITY_3]: ['l', '3'],
	[Controls.ABILITY_4]: ['u', '4'],
	[Controls.ABILITY_5]: ['i', '5'],
	[Controls.ABILITY_6]: ['o', '6'],
	[Controls.ABILITY_7]: ['p', '7'],
	[Controls.TARGET_LOCK]: ['capslock'],
	[Controls.ZOOM_IN]: ['x'],
	[Controls.ZOOM_OUT]: ['z'],
	[Controls.MINIMAP_ZOOM]: ['q'],
};

class Keymapping {
	// map control (e.g. ZOOM_OUT) to keys (e.g. ['z', 'y'])
	static getKeys(control) {
		return Keymapping.ControlToKeyMap[control];
	}

	// map control (e.g. ZOOM_OUT) to state
	static getControlState(controller, control) {
		return State.merge(Keymapping.getKeys(control).map(key => controller.getKeyState(key)));
	}
}

Keymapping.Controls = Controls;
Keymapping.ControlToKeyMap = ControlToKeyMap;

module.exports = Keymapping;

},{"../util/Enum":99,"./Controller":12,"./State":14}],14:[function(require,module,exports){
const makeEnum = require('../util/Enum');

// larger values have priority when multiple keys are mapped to the same control
const States = makeEnum('UP', 'RELEASED', 'PRESSED', 'DOWN');

class State {
	constructor(state = States.UP) {
		this.state = state;
	}

	static merge(states) {
		return new State(Math.max(...states.map(state => state.state)));
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

},{"../util/Enum":99}],15:[function(require,module,exports){
class Buff {
	static get_(buffs, key) {
		return buffs.reduce((acc, {[key]: value = 0}) => acc + value, 1);
	}

	static moveSpeed(buffs) {
		return Buff.get_(buffs, 'moveSpeed_');
	}

	set moveSpeed(value) {
		this.moveSpeed_ = value;
	}
}

module.exports = Buff;

},{}],16:[function(require,module,exports){
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
		this.queuedTrackedIntersections = [];
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
		this.setBounds();
	}

	checkPosition(intersectionFinder) {
		return this.x !== undefined &&
			!intersectionFinder.intersections(this.layer, this.bounds).length
	}

	checkMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		return intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
	}

	safeMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		let intersectionMove = intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
		this.move(intersectionMove.x, intersectionMove.y);
		intersectionMove.trackedOnlyReferences.forEach(reference => reference.queueTrackedIntersection(this));
		return intersectionMove;
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		this.setMoveDirection(dx, dy);
		this.setBounds();
	}

	setMoveDirection(dx, dy) {
		if (dx || dy)
			this.moveDirection = setMagnitude(dx, dy);
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

	queueTrackedIntersection(reference) {
		this.queuedTrackedIntersections.push(reference);
	}

	changeHealth(amount) {
	}

	removeUi() {
		/* override, return true if ui is not longer relevant and should be removed from the ui queue */
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}

	paintUi(painter, camera) {
	}
}

module.exports = Entity;

},{"../intersection/Bounds":70,"../util/Number":104}],17:[function(require,module,exports){
const Entity = require('./Entity');
const Pool = require('../util/Pool');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
		this.stats = {armor: 1};
	}

	setStats(stats) {
		this.stats = {...this.stats, ...stats};
	}

	changeHealth(amount) {
		this.health.change(amount / this.stats.armor);
	}

	restoreHealth() {
		this.health.restore();
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

module.exports = LivingEntity;

},{"../util/Pool":106,"./Entity":16}],18:[function(require,module,exports){
const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const RectGraphic = require('../graphics/RectGraphic');

class MapBoundary extends Entity {
	static createBoxBoundaries(width, height) {
		const b = .1;
		return [
			[-b / 2, height / 2, b, height + b * 2], // left
			[width / 2, -b / 2, width + b * 2, b], // top
			[width + b / 2, height / 2, b, height + b * 2], // right
			[width / 2, height + b / 2, width + b * 2, b], // bottom
		].map(xyWidthHeight =>
			new MapBoundary(...xyWidthHeight));
	}

	constructor(...xyWidthHeight) {
		super(...xyWidthHeight, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RectGraphic(xyWidthHeight[2], xyWidthHeight[3], {fill: true, color: Colors.Entity.MAP_BOUNDARY.get()}));
	}
}

module.exports = MapBoundary;

},{"../graphics/RectGraphic":62,"../intersection/IntersectionFinder":71,"../util/Constants":97,"./Entity":16}],19:[function(require,module,exports){
const LivingEntity = require('./LivingEntity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors, Positions} = require('../util/Constants');
const VShip = require('../graphics/VShip');
const Pool = require('../util/Pool');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const LaserAttack = require('../abilities/LaserAttack');
const ChargedProjectileAttack = require('../abilities/ChargedProjectileAttack');
const Dash = require('../abilities/Dash');
const Heal = require('../abilities/Heal');
const Accelerate = require('../abilities/Accelerate');
const BombAttack = require('../abilities/BombAttack');
const DelayedRegen = require('../abilities/DelayedRegen');
const Decay = require('../util/Decay');
const Buff = require('./Buff');
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
		this.setGraphics(new VShip(this.width, this.height, {fill: true, color: Colors.Entity.PLAYER.get()}));

		this.stamina = new Pool(80, .1);
		this.abilities = [
			new ProjectileAttack(),
			new Dash(),
			// new Heal(),
			// new BombAttack(),
		];
		this.abilities.forEach((ability, i) => ability.setUi(i));

		this.passiveAbilities = [
			new DelayedRegen()];

		this.buffs = [];

		this.recentDamage = new Decay(.1, .001);
	}

	update(map, controller, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, intersectionFinder);
		this.abilityControl(map, controller, intersectionFinder);
		this.targetLockControl(controller, intersectionFinder);
		this.createMovementParticle(map);
	}

	refresh() {
		this.stamina.increment();
		this.recentDamage.decay();
	}

	moveControl(controller, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);

		let left = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_LEFT).active;
		let up = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_UP).active;
		let right = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_RIGHT).active;
		let down = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_DOWN).active;

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
		this.safeMove(intersectionFinder, dx, dy, .005 * Buff.moveSpeed(this.buffs));
	}

	abilityControl(map, controller, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};

		this.abilities
			.forEach((ability, index) => {
				let wantActive = Keymapping.getControlState(controller, Keymapping.Controls.ABILITY_I[index]).active;
				ability.update(this, direct, map, intersectionFinder, this, wantActive);
			});

		this.passiveAbilities.forEach((ability) =>
			ability.update(this, direct, map, intersectionFinder, this, true));
	}

	targetLockControl(controller, intersectionFinder) {
		if (this.targetLock && this.targetLock.health.isEmpty())
			this.targetLock = null;

		if (!Keymapping.getControlState(controller, Keymapping.Controls.TARGET_LOCK).pressed)
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
		const RATE = .2, SIZE = .005, DIRECT_VELOCITY = .003, RAND_VELOCITY = .001;

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

	addBuff() {
		let buff = new Buff();
		this.buffs.push(buff);
		return buff;
	}

	paintUi(painter, camera) {
		// target lock
		// todo [medium] target lock draws over monster health bar
		if (this.targetLock)
			painter.add(RectC.withCamera(camera, this.targetLock.x, this.targetLock.y,
				this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE,
				{color: Colors.TARGET_LOCK.get(), thickness: 3}));

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = Positions.BAR_HEIGHT + Positions.MARGIN;
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.stamina.getRatio(), Colors.STAMINA.getShade(Colors.BAR_SHADING), Colors.STAMINA.get(), Colors.STAMINA.get(Colors.BAR_SHADING)));
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.health.getRatio(), Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get(Colors.BAR_SHADING)));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;

},{"../abilities/Accelerate":3,"../abilities/BombAttack":4,"../abilities/ChargedProjectileAttack":5,"../abilities/Dash":6,"../abilities/DelayedRegen":7,"../abilities/Heal":8,"../abilities/LaserAttack":9,"../abilities/ProjectileAttack":10,"../control/Keymapping":13,"../graphics/VShip":66,"../intersection/Bounds":70,"../intersection/IntersectionFinder":71,"../painter/Bar":83,"../painter/Rect":90,"../painter/RectC":91,"../util/Constants":97,"../util/Decay":98,"../util/Number":104,"../util/Pool":106,"./Buff":15,"./LivingEntity":17,"./particle/Dust":54}],20:[function(require,module,exports){
const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const RockGraphic = require('../graphics/RockGraphic');

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.ROCK.get()}));
	}
}

module.exports = Rock;

},{"../graphics/RockGraphic":63,"../intersection/IntersectionFinder":71,"../util/Constants":97,"./Entity":16}],21:[function(require,module,exports){
const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const RockGraphic = require('../graphics/RockGraphic');

class RockMineral extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.ROCK_MINERAL.get()}));
	}
}

module.exports = RockMineral;

},{"../graphics/RockGraphic":63,"../intersection/IntersectionFinder":71,"../util/Constants":97,"./Entity":16}],22:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {getRectDistance} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

class AreaDegen extends Entity {
	// if maxTargets <= 0, will be treated as infinite
	constructor(x, y, range, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, range, range, layer);
		this.range = range;
		this.time = time; // -1 will be infinite, 0 will be 1 tick
		this.damage = damage;
	}

	update(map, intersectionFinder) {
		intersectionFinder.intersections(this.layer, this.bounds)
			.forEach(monster => monster.changeHealth(-this.damage));
		return !this.time--;
	}

	paint(painter, camera, warning = false) {
		let graphicOptions = warning ?
			{color: Colors.Entity.AREA_DEGEN.WARNING_BORDER.get()} :
			{fill: true, color: Colors.Entity.AREA_DEGEN.ACTIVE_FILL.get()};
		painter.add(RectC.withCamera(camera,
			this.x, this.y,
			this.range, this.range,
			graphicOptions));
	}
}

module.exports = AreaDegen;

},{"../../intersection/IntersectionFinder":71,"../../painter/RectC":91,"../../util/Constants":97,"../../util/Number":104,"../Entity":16}],23:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {getRectDistance} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

class Bomb extends Entity {
	// if maxTargets <= 0, will be treated as infinite
	constructor(x, y, width, height, range, time, damage, maxTargets, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.range = range;
		this.time = time;
		this.damage = damage;
		this.maxTargets = maxTargets;
	}

	update(map, intersectionFinder) {
		if (this.time--)
			return;

		let targetsCount = this.maxTargets;
		map.monsters.find(monster => {
			let targetDistance = getRectDistance(monster.x - this.x, monster.y - this.y);
			if (targetDistance < this.range) {
				monster.changeHealth(-this.damage);
				return !--targetsCount;
			}
		});

		return true;
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.range * 2, this.range * 2, {color: Colors.Entity.Bomb.WARNING_BORDER.get()}));
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: Colors.Entity.Bomb.ENTITY.get()}));
	}
}

module.exports = Bomb;

},{"../../intersection/IntersectionFinder":71,"../../painter/RectC":91,"../../util/Constants":97,"../../util/Number":104,"../Entity":16}],24:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const Line = require('../../painter/Line');

class Laser extends Entity {
	constructor(x, y, dx, dy, width, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, width, layer);
		this.dx = dx;
		this.dy = dy;
		this.time = time;
		this.damage = damage;
	}

	update(map, intersectionFinder) {
		({x: this.moveX, y: this.moveY, reference: this.intersection} =
			this.checkMove(intersectionFinder, this.dx, this.dy, -1, true));

		if (this.intersection)
			this.intersection.changeHealth(-this.damage);

		return !this.time--;
	}

	paint(painter, camera) {
		painter.add(Line.withCamera(
			camera,
			this.x, this.y,
			this.x + this.moveX, this.y + this.moveY,
			this.width,
			{fill: true, color: Colors.Entity.HOSTILE_PROJECTILE.get()}));
	}
}

module.exports = Laser;

},{"../../intersection/IntersectionFinder":71,"../../painter/Line":85,"../../util/Constants":97,"../Entity":16}],25:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {randVector} = require('../../util/Number');
const DamageDust = require('../particle/DamageDust');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

class Projectile extends Entity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
		this.color = friendly ? Colors.Entity.FRIENDLY_PROJECTILE.get() : Colors.Entity.HOSTILE_PROJECTILE.get()
	}

	update(map, intersectionFinder) { // todo [medium] fix naming disconnect, map refers to lasers and projectiles as projectiles. entities refer to laser and projectile as attacks. create projectile/attack parent class to have update interface
		const FRICTION = 1;

		let intersection = this.queuedTrackedIntersections[0] || this.safeMove(intersectionFinder, this.vx, this.vy, -1, true).reference;

		if (intersection) {
			intersection.changeHealth(-this.damage);
			map.addParticle(new DamageDust(this.x, this.y, .005, ...randVector(.001), 100));
			return true;
		}

		if (!this.time--)
			return true;

		this.vx *= FRICTION;
		this.vy *= FRICTION;

		// todo [low] do damage when collided with (as opposed to when colliding)
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {fill: true, color: this.color}));
	}
}

module.exports = Projectile;

},{"../../intersection/IntersectionFinder":71,"../../painter/RectC":91,"../../util/Constants":97,"../../util/Number":104,"../Entity":16,"../particle/DamageDust":53}],26:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const {cos, sin} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'REVERSE');

class Aim extends Module {
	config(origin, rotationSpeed = 0, skirmishTime = 0, skirmishDistance = 0, initialDirVector = null) {
		this.origin = origin;
		this.rotationSpeed = rotationSpeed;
		this.rotationSpeedCos = cos(rotationSpeed); // 0 rotationSpeed means instant rotation
		this.rotationSpeedSin = sin(rotationSpeed);
		this.skirmishTime = skirmishTime;
		this.skirmishDistance = skirmishDistance;
		if (initialDirVector) {
			this.dir = initialDirVector;
			this.dir.magnitude = 1;
		}
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
		if (this.stage === Stages.REVERSE)
			delta.negate();

		if (this.skirmishTime) {
			if (!this.skirmishTick) {
				this.skirmishTick = this.skirmishTime;
				this.skirmishVec = Vector.fromRand(this.skirmishDistance);
				if (this.skirmishVec.dot(delta) > 0)
					this.skirmishVec.negate();
			}
			this.skirmishTick--;
			delta.add(this.skirmishVec);
		}

		if (!this.dir) {
			this.dir = Vector.fromObj(delta);
			this.dir.magnitude = 1;
		} else if (this.rotationSpeed)
			this.dir.rotateByCosSinTowards(this.rotationSpeedCos, this.rotationSpeedSin, delta);
		else {
			this.dir = delta;
			this.dir.magnitude = 1;
		}
	}
}

Aim.Stages = Stages;

module.exports = Aim;

},{"../../util/Enum":99,"../../util/Number":104,"../../util/Vector":107,"./Module":32}],27:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const AreaDegen = require('../attack/AreaDegen');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class AreaDegenLayer extends Module {
	config(origin, range, duration, damage) {
		this.origin = origin;
		this.range = range;
		this.duration = duration;
		this.damage = damage;
		this.warningAreaDegen = this.areaDegen;
	}

	get areaDegen() {
		return new AreaDegen(this.origin.x, this.origin.y, this.range, this.duration, this.damage, false)
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.WARNING)
			this.warningAreaDegen.setPosition(this.origin.x, this.origin.y);
		else if (this.stage === Stages.ACTIVE)
			map.addProjectile(this.areaDegen);
	}

	paint(painter, camera) {
		if (this.stage === Stages.WARNING)
			this.warningAreaDegen.paint(painter, camera, true);

	}
}

AreaDegenLayer.Stages = Stages;

module.exports = AreaDegenLayer;

},{"../../util/Enum":99,"../attack/AreaDegen":22,"./Module":32}],28:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {cos, sin} = require('../../util/Number');
const Vector = require('../../util/Vector');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed, dirModule) {
		this.origin = origin;
		this.speed = speed;
		this.dirModule = dirModule
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.safeMove(intersectionFinder, this.dirModule.dir.x, this.dirModule.dir.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;

},{"../../util/Enum":99,"../../util/Number":104,"../../util/Vector":107,"./Module":32}],29:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'COOLDOWN');
const Phases = makeEnum('UNTRIGGERED', 'TRIGGERED');

class Cooldown extends ModuleManager {
	config(duration) {
		this.cooldown = new Phase(duration, 0);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.INACTIVE)
			this.cooldown.sequentialTick();
		if (this.cooldown.get() === 1 && this.stage === Stages.ACTIVE) {
			this.cooldown.setPhase(0);
			this.modulesSetStage(Phases.TRIGGERED);
		} else
			this.modulesSetStage(Phases.UNTRIGGERED);
	}
}

Cooldown.Stages = Stages;
Cooldown.Phases = Phases;

module.exports = Cooldown;

},{"../../util/Enum":99,"../../util/Phase":105,"./ModuleManager":33}],30:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {setMagnitude} = require('../../util/Number');

const Stages = makeEnum('INACTIVE', 'AIMING', 'WARNING', 'DASHING');
const Phases = makeEnum('INACTIVE', 'AIMING', 'WARNING', 'DASHING');

class Dash extends ModuleManager {
	config(origin, distance, dashDuration) {
		this.origin = origin;
		this.distance = distance;
		this.dashDuration = dashDuration;
		this.target = {};
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.DASHING)
			this.collided = false;

		// stage should be equivalent to phase unless we've collided while dashing
		if (!this.collided)
			this.modulesSetStage(this.stage);

		if (this.stage === Stages.AIMING) {
			let delta = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.distance);
			this.target.x = this.origin.x + delta.x;
			this.target.y = this.origin.y + delta.y;
			this.dir = setMagnitude(delta.x, delta.y);

		} else if (this.stage === Stages.DASHING && !this.collided) {
			this.collided = this.origin.safeMove(intersectionFinder, this.dir.x, this.dir.y, this.distance / this.dashDuration, true).reference;
			if (this.collided) {
				this.modulesSetStage(Phases.INACTIVE);
				this.target.x = this.origin.x;
				this.target.y = this.origin.y;
			}
		}
	}
}

Dash.Stages = Stages;
Dash.Phases = Phases;

module.exports = Dash;

},{"../../util/Enum":99,"../../util/Number":104,"./ModuleManager":33}],31:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
// variable number of phases per number of arguments to config

class Distance extends ModuleManager {
	// distances should be in increasing order
	// if this.distances = [10, 20], then phase 1 = [10, 20)
	config(origin, ...distances) {
		this.origin = origin;
		this.distances = distances;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		let phase = this.distances.findIndex(distance => targetDistance < distance);
		if (phase === -1)
			phase = this.distances.length;
		this.modulesSetStage(phase);
	}
}

Distance.Stages = Stages;

module.exports = Distance;

},{"../../util/Enum":99,"../../util/Number":104,"./ModuleManager":33}],32:[function(require,module,exports){
class Module {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStage(stage) {
		if (stage !== undefined)
			this.stage = stage
	}

	apply(map, intersectionFinder, target) {
		this.apply_(map, intersectionFinder, target);
	}

	apply_(map, intersectionFinder, target) {
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;

},{}],33:[function(require,module,exports){
const Module = require('./Module');

class ModuleManager extends Module {
	constructor() {
		super();
		this.modules = [];
		this.phase = -1;
	}

	addModule(module, stagesMap) {
		this.modules.push({module, stagesMap});
	}

	// todo [med] rename to setPhase
	modulesSetStage(phase) {
		if (phase === this.phase)
			return;
		this.phase = phase;
		this.modules.forEach(({module, stagesMap}) =>
			module.setStage(stagesMap[phase]));
	}

	apply(map, intersectionFinder, target) {
		this.apply_(map, intersectionFinder, target);
		this.modules.forEach(({module}) =>
			module.apply(map, intersectionFinder, target));
	}

	paint(painter, camera) {
		this.modules.forEach(({module}) =>
			module.paint(painter, camera));
	}
}

module.exports = ModuleManager;

// todo [low] consider merging moduleManager and module

},{"./Module":32}],34:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const AreaDegen = require('../attack/AreaDegen');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class NearbyDegen extends Module {
	config(origin, range, damage) {
		this.origin = origin;
		this.areaDegen = new AreaDegen(origin.x, origin.y, range, -1, damage, false);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.INACTIVE)
			this.areaDegen.setPosition(this.origin.x, this.origin.y);
		if (this.stage === Stages.ACTIVE)
			this.areaDegen.update(map, intersectionFinder);
	}

	paint(painter, camera) {
		if (this.stage !== Stages.INACTIVE)
			this.areaDegen.paint(painter, camera, this.stage === Stages.WARNING);

	}
}

NearbyDegen.Stages = Stages;

module.exports = NearbyDegen;

},{"../../util/Enum":99,"../attack/AreaDegen":22,"./Module":32}],35:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');

const PrimaryStages = makeEnum('PLAY', 'LOOP', 'PAUSE', 'STOP');
// variable number of secondary stages depending on number of patterns defined
// variable number of phases depending on number of periods defined

class patternedPeriod extends ModuleManager {
	config(periods, patterns, queues) {
		this.periods = periods;
		this.patterns = patterns;
		// When secondaryStage is set to i,
		// if queues[i] is true, will not update curPatternI to i until after curPatternI completes
		// else if queues[i] is false, will update curPatternI to i immediately.
		this.queues = queues;
		this.setCurPattern(0);
	}

	setCurPattern(patternI) {
		this.curPatternI = patternI;
		this.curPeriodI = 0;
		this.resetDuration();
	}

	get period() {
		return this.patterns[this.curPatternI][this.curPeriodI];
	}

	resetDuration() {
		this.curDuration = this.periods[this.period];
		if (this.curDuration)
			this.curDuration++;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage[0] === PrimaryStages.STOP)
			this.setCurPattern(0);

		else if (this.stage[0] !== PrimaryStages.PAUSE) {
			if (this.stage[1] !== this.curPatternI && (!this.queues[this.stage[1]] || !this.curDuration))
				this.setCurPattern(this.stage[1]);
			if (this.curDuration && !--this.curDuration) {
				if (this.curPeriodI < this.patterns[this.curPatternI].length - 1)
					this.curPeriodI++;
				else if (this.stage[1] !== this.curPatternI)
					this.setCurPattern(this.stage[1]);
				else if (this.stage[0] === PrimaryStages.LOOP)
					this.curPeriodI = 0;
				this.resetDuration();
			}
		}

		this.modulesSetStage(this.period);
	}
}

patternedPeriod.PrimaryStages = PrimaryStages;

module.exports = patternedPeriod;

},{"../../util/Enum":99,"./ModuleManager":33}],36:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');

const Stages = makeEnum('PLAY', 'LOOP', 'PAUSE', 'STOP');
// variable number of phases per number of arguments to config

class Period extends ModuleManager {
	config(...periods) {
		this.periodCount = periods.length;
		this.periods = new Phase(...periods, 0);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.STOP)
			this.periods.setPhase(0);

		else if (this.stage !== Stages.PAUSE) {
			this.periods.sequentialTick();
			if (this.periods.get() === this.periodCount && this.stage === Stages.LOOP)
				this.periods.setPhase(0);
		}

		this.modulesSetStage(this.periods.get());
	}
}

Period.Stages = Stages;

module.exports = Period;

},{"../../util/Enum":99,"../../util/Phase":105,"./ModuleManager":33}],37:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const {cos, sin} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Position extends Module {
	config(origin = null, randMinMag = 0, randMaxMag = 0) {
		this.origin = origin; // if null, will use target
		this.randMinMag = randMinMag;
		this.randMaxMag = randMaxMag;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			({x: this.x, y: this.y} =
				Vector.fromObj(this.origin || target).add(Vector.fromRand(this.randMinMag, this.randMaxMag)));
	}
}

Position.Stages = Stages;

module.exports = Position;

},{"../../util/Enum":99,"../../util/Number":104,"../../util/Vector":107,"./Module":32}],38:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const {thetaToVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Rotate extends Module {
	config(origin, rate = 1 / 50, theta = 0, atTarget = false) {
		this.origin = origin;
		this.rate = rate;
		this.theta = theta;
		this.atTarget = atTarget;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;
		if (this.atTarget) {
			let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
			this.origin.setMoveDirection(delta.x, delta.y);
		} else {
			this.theta += this.rate;
			this.origin.setMoveDirection(...thetaToVector(this.theta));
		}
	}
}

Rotate.Stages = Stages;

module.exports = Rotate;

},{"../../util/Enum":99,"../../util/Number":104,"../../util/Vector":107,"./Module":32}],39:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude, randVector} = require('../../util/Number');
const Projectile = require('../attack/Projectile');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Shotgun extends Module {
	config(origin, rate, count, velocity, spread, duration, damage, dirModule, predictableRate = false, size = .02) {
		this.origin = origin;
		this.rate = rate;
		this.count = count;
		this.velocity = velocity;
		this.spread = spread;
		this.duration = duration;
		this.damage = damage;
		this.dirModule = dirModule;
		this.predictableRate = predictableRate;
		this.size = size;
		this.rateCurrent = 0;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		if (!this.predictableRate && Math.random() > this.rate)
			return;
		if (this.predictableRate && (this.rateCurrent += this.rate) < 1)
			return;
		this.rateCurrent--;

		for (let i = 0; i < this.count; i++) {
			let directv = this.dirModule.dir.copy;
			directv.magnitude = this.velocity;
			let randv = randVector(this.spread);

			let projectile = new Projectile(
				this.origin.x, this.origin.y,
				this.size, this.size,
				directv.x + randv[0], directv.y + randv[1],
				this.duration, this.damage, false);
			map.addProjectile(projectile);
		}
	}
}

Shotgun.Stages = Stages;

module.exports = Shotgun;

},{"../../util/Enum":99,"../../util/Number":104,"../attack/Projectile":25,"./Module":32}],40:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const Laser = require('../attack/Laser');
const {Colors} = require('../../util/Constants');
const Line = require('../../painter/Line');

const Stages = makeEnum('WARNING', 'ACTIVE', 'INACTIVE');

class StaticLaser extends Module {
	config(origin, spread, range, dirModule, duration, damage, size = .02) {
		this.origin = origin;
		this.spread = spread;
		this.range = range;
		this.duration = duration;
		this.damage = damage;
		this.size = size;
		this.dirModule = dirModule;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let dir = Vector.fromRand(this.spread).add(this.dirModule.dir);

		let laser = new Laser(
			this.origin.x, this.origin.y,
			dir.x, dir.y,
			this.size, this.duration, this.damage, false);
		map.addProjectile(laser);
	}

	paint(painter, camera) {
		if (this.stage !== Stages.WARNING)
			return;
		let warning = Vector.fromObj(this.origin).add(this.dirModule.dir);
		painter.add(Line.withCamera(
			camera,
			this.origin.x, this.origin.y,
			warning.x, warning.y,
			this.size,
			{color: Colors.Entity.AREA_DEGEN.WARNING_BORDER.get()}));
	}
}

StaticLaser.Stages = Stages;

module.exports = StaticLaser;

},{"../../painter/Line":85,"../../util/Constants":97,"../../util/Enum":99,"../../util/Vector":107,"../attack/Laser":24,"./Module":32}],41:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');

const Stages = makeEnum('INACTIVE', 'ACTIVE');
const Phases = makeEnum('INACTIVE', 'UNTRIGGERED', 'TRIGGERED');

class Trigger extends ModuleManager {
	config(duration) {
		this.duration = duration;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE && this.lastStage !== this.stage) {
			this.modulesSetStage(Phases.TRIGGERED);
			this.currentDuration = this.duration;
		} else if (this.currentDuration)
			this.currentDuration--;
		else if (this.stage === Stages.INACTIVE)
			this.modulesSetStage(Phases.INACTIVE);
		else if (this.lastStage === this.stage)
			this.modulesSetStage(Phases.UNTRIGGERED);
		else
			console.error('impossible branch reached.');
		this.lastStage = this.stage;
	}
}

Trigger.Stages = Stages;
Trigger.Phases = Phases;

module.exports = Trigger;

},{"../../util/Enum":99,"./ModuleManager":33}],42:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Period = require('../module/Period');
const Aim = require('../module/Aim');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const Dash = require('../module/Dash');
const Trigger = require('../module/Trigger');
const NearbyDegen = require('../module/NearbyDegen');
// const Boomerang = require('../module/Boomerang');

const Phases = makeEnum('ONE');

class Champion extends Monster {
	constructor(x, y) {
		super(x, y, .05, .05, 1);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(100, 25, 25, 30);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP,});

		let chaseAim = new Aim();
		chaseAim.config(this);
		period.addModule(chaseAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .005, aim);
		period.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.INACTIVE,
		});

		let shotgunAim = new Aim();
		shotgunAim.config(this);
		period.addModule(shotgunAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let shotgun = new Shotgun();
		shotgun.config(this, .03, 1, .01, .001, 50, .02, shotgunAim);
		period.addModule(shotgun, {
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.ACTIVE,
			2: Shotgun.Stages.INACTIVE,
			3: Shotgun.Stages.INACTIVE,
		});

		let dash = new Dash();
		dash.config(this, .4, 30);
		period.addModule(dash, {
			0: Dash.Stages.INACTIVE,
			1: Dash.Stages.AIMING,
			2: Dash.Stages.WARNING,
			3: Dash.Stages.DASHING,
		});

		let triggerDashEnd = new Trigger();
		triggerDashEnd.config(20);
		dash.addModule(triggerDashEnd, {
			[Dash.Phases.INACTIVE]: Trigger.Stages.ACTIVE,
			[Dash.Phases.AIMING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.WARNING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.DASHING]: Trigger.Stages.INACTIVE,
		});

		let dashAttackTarget = new NearbyDegen();
		dashAttackTarget.config(dash.target, .1, .002);
		triggerDashEnd.addModule(dashAttackTarget, {
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(dashAttackTarget, {
			[Dash.Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Champion;

},{"../../graphics/WShip":67,"../../util/Constants":97,"../../util/Enum":99,"../../util/Phase":105,"../module/Aim":26,"../module/Chase":28,"../module/Dash":30,"../module/NearbyDegen":34,"../module/Period":36,"../module/Shotgun":39,"../module/Trigger":41,"./Monster":43}],43:[function(require,module,exports){
const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const ModuleManager = require('../module/ModuleManager');
const {Colors, Positions} = require('../../util/Constants');
const BarC = require('../../painter/BarC');
const Bar = require('../../painter/Bar');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.moduleManager = new ModuleManager();
	}

	update(map, intersectionFinder, monsterKnowledge) {
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.moduleManager.paint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get()));
	}

	paintUi(painter, camera) {
		painter.add(new Bar(
			Positions.MARGIN,
			Positions.MARGIN,
			1 - Positions.MARGIN * 2,
			Positions.BAR_HEIGHT,
			this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING),
			Colors.LIFE.get(),
			Colors.LIFE.getShade(Colors.BAR_SHADING)));
	}
}

module.exports = Monster;

},{"../../intersection/IntersectionFinder":71,"../../painter/Bar":83,"../../painter/BarC":84,"../../util/Constants":97,"../LivingEntity":17,"../module/ModuleManager":33}],44:[function(require,module,exports){
class MonsterKnowledge {
	constructor() {
	}

	setPlayer(player) {
		this.player = player;
	}

	getPlayer(player) {
		return this.player;
	}
}

module.exports = MonsterKnowledge;

},{}],45:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Period = require('../../module/Period');
const Rotate = require('../../module/Rotate');
const Aim = require('../../module/Aim');
const StaticLaser = require('../../module/StaticLaser');

const Phases = makeEnum('ONE');

class AimingLaserTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 1.6);
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(50, 70, 80, 1);
		period.periods.setRandomTick();
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		let rotate = new Rotate();
		rotate.config(this, 0, 0, true);
		period.addModule(rotate, {
			0: Rotate.Stages.INACTIVE,
			1: Rotate.Stages.ACTIVE,
			2: Rotate.Stages.INACTIVE,
			3: Rotate.Stages.INACTIVE,
		});

		let aim = new Aim();
		aim.config(this, 0);
		period.addModule(aim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let staticLaser = new StaticLaser();
		staticLaser.config(this, .005, .5, aim, 50, .005);
		period.addModule(staticLaser, {
			0: StaticLaser.Stages.INACTIVE,
			1: StaticLaser.Stages.INACTIVE,
			2: StaticLaser.Stages.WARNING,
			3: StaticLaser.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = AimingLaserTurret;

},{"../../../graphics/Rect1DotsShip":60,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Phase":105,"../../module/Aim":26,"../../module/Period":36,"../../module/Rotate":38,"../../module/StaticLaser":40,".././Monster":43}],46:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DoubleHorizDiamondShip = require('../../../graphics/DoubleHorizDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const Chase = require('../../module/Chase');
const Cooldown = require('../../module/Cooldown');
const AreaDegenLayer = require('../../module/AreaDegenLayer');

const Phases = makeEnum('ONE');

class BombLayer extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 1.2);
		this.setGraphics(new DoubleHorizDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let aim = new Aim();
		aim.config(this, PI / 80, 80, .2);
		distance.addModule(aim, {
			0: Aim.Stages.REVERSE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		distance.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
		});

		let cooldown = new Cooldown();
		cooldown.config(80);
		distance.addModule(cooldown, {
			0: Cooldown.Stages.ACTIVE,
			1: Cooldown.Stages.ACTIVE,
			2: Cooldown.Stages.COOLDOWN,
		});

		let areaDegen = new AreaDegenLayer();
		areaDegen.config(this, .1, 200, .003);
		cooldown.addModule(areaDegen, {
			[Cooldown.Phases.UNTRIGGERED]: AreaDegenLayer.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: AreaDegenLayer.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = BombLayer;

},{"../../../graphics/DoubleHorizDiamondShip":56,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Number":104,"../../../util/Phase":105,"../../module/Aim":26,"../../module/AreaDegenLayer":27,"../../module/Chase":28,"../../module/Cooldown":29,"../../module/Distance":31,".././Monster":43}],47:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const HexagonShip = require('../../../graphics/HexagonShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Period = require('../../module/Period');
const Aim = require('../../module/Aim');
const Chase = require('../../module/Chase');
const Dash = require('../../module/Dash');
const Trigger = require('../../module/Trigger');
const NearbyDegen = require('../../module/NearbyDegen');

const Phases = makeEnum('ONE');

class DashChaser extends Monster {
	constructor(x, y) {
		super(x, y, .06, .06, 1.2);
		this.setGraphics(new HexagonShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .8, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let period = new Period();
		period.config(125, 35, 15, 20, 1);
		distance.addModule(period, {
			0: Period.Stages.LOOP,
			1: Period.Stages.PLAY,
			2: Period.Stages.PLAY,
		});

		let aim = new Aim();
		aim.config(this, PI / 80, 80, .2);
		period.addModule(aim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
			4: Aim.Stages.ACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .002, aim);
		period.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.INACTIVE,
			4: Chase.Stages.ACTIVE,
		});

		let dash = new Dash();
		dash.config(this, .25, 20);
		period.addModule(dash, {
			0: Dash.Stages.INACTIVE,
			1: Dash.Stages.AIMING,
			2: Dash.Stages.WARNING,
			3: Dash.Stages.DASHING,
			4: Dash.Stages.INACTIVE,
		});

		let triggerDashEnd = new Trigger();
		triggerDashEnd.config(1);
		dash.addModule(triggerDashEnd, {
			[Dash.Phases.INACTIVE]: Trigger.Stages.ACTIVE,
			[Dash.Phases.AIMING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.WARNING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.DASHING]: Trigger.Stages.INACTIVE,
		});

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(dash.target, .15, .06);
		triggerDashEnd.addModule(nearbyDegen, {
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(nearbyDegen, {
			[Dash.Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = DashChaser;

},{"../../../graphics/HexagonShip":58,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Number":104,"../../../util/Phase":105,"../../module/Aim":26,"../../module/Chase":28,"../../module/Dash":30,"../../module/Distance":31,"../../module/NearbyDegen":34,"../../module/Period":36,"../../module/Trigger":41,".././Monster":43}],48:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DiamondShip = require('../../../graphics/DiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const PatternedPeriod = require('../../module/PatternedPeriod');
const Chase = require('../../module/Chase');
const NearbyDegen = require('../../module/NearbyDegen');

const Phases = makeEnum('ONE');

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .6);
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let patternedPeriod = new PatternedPeriod();
		patternedPeriod.config([0, 60, 60, 60], [[0], [1, 2, 3], [3]], [false, false, true]);
		distance.addModule(patternedPeriod, {
			0: [PatternedPeriod.PrimaryStages.LOOP, 1],
			1: [PatternedPeriod.PrimaryStages.PLAY, 2],
			2: [PatternedPeriod.PrimaryStages.STOP],
		});

		let aim = new Aim();
		aim.config(this, PI / 20, 50, .1);
		patternedPeriod.addModule(aim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.ACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		patternedPeriod.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.ACTIVE,
		});

		let degen = new NearbyDegen();
		degen.config(this, .15, .003);
		patternedPeriod.addModule(degen, {
			0: NearbyDegen.Stages.INACTIVE,
			1: NearbyDegen.Stages.WARNING,
			2: NearbyDegen.Stages.ACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = ExplodingTick;

},{"../../../graphics/DiamondShip":55,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Number":104,"../../../util/Phase":105,"../../module/Aim":26,"../../module/Chase":28,"../../module/Distance":31,"../../module/NearbyDegen":34,"../../module/PatternedPeriod":35,".././Monster":43}],49:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const MechanicalBossEarly = require('./MechanicalBossEarly');
const Phase = require('../../../util/Phase');
const Period = require('../../module/Period');
const Position = require('../../module/Position');
const AreaDegenLayer = require('../../module/AreaDegenLayer');

const Phases = makeEnum('ONE');

class MechanicalBoss extends MechanicalBossEarly {
	addModules() {
		super.addModules();
		this.addSurroundDegenModule();
		this.addChaseDegenModule();
	}

	addSurroundDegenModule() {
		let surroundDegenPeriod = new Period();
		surroundDegenPeriod.config(1, 38, 1);
		this.period.addModule(surroundDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.LOOP,
			2: Period.Stages.STOP,
			3: Period.Stages.STOP,
		});

		for (let i = 0; i < 1; i++) {
			let surroundDegenTarget = new Position();
			surroundDegenTarget.config(this, .2, .5);
			surroundDegenPeriod.addModule(surroundDegenTarget, {
				0: Position.Stages.ACTIVE,
				1: Position.Stages.INACTIVE,
				2: Position.Stages.INACTIVE,
			});

			let surroundDegen = new AreaDegenLayer();
			surroundDegen.config(surroundDegenTarget, .1, 200, .002);
			surroundDegenPeriod.addModule(surroundDegen, {
				0: AreaDegenLayer.Stages.INACTIVE,
				1: AreaDegenLayer.Stages.WARNING,
				2: AreaDegenLayer.Stages.ACTIVE,
			});
		}
	}

	addChaseDegenModule() {
		let chaseDegenPeriod = new Period();
		chaseDegenPeriod.config(1, 38, 1);
		this.period.addModule(chaseDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.STOP,
			2: Period.Stages.STOP,
			3: Period.Stages.LOOP,
		});

		let chaseDegenTarget = new Position();
		chaseDegenTarget.config();
		chaseDegenPeriod.addModule(chaseDegenTarget, {
			0: Position.Stages.ACTIVE,
			1: Position.Stages.INACTIVE,
			2: Position.Stages.INACTIVE,
		});

		let chaseDegen = new AreaDegenLayer();
		chaseDegen.config(chaseDegenTarget, .1, 200, .002);
		chaseDegenPeriod.addModule(chaseDegen, {
			0: AreaDegenLayer.Stages.INACTIVE,
			1: AreaDegenLayer.Stages.WARNING,
			2: AreaDegenLayer.Stages.ACTIVE,
		});
	}
}

module.exports = MechanicalBoss;

},{"../../../util/Enum":99,"../../../util/Phase":105,"../../module/AreaDegenLayer":27,"../../module/Period":36,"../../module/Position":37,"./MechanicalBossEarly":50}],50:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Vector = require('../../../util/Vector');
const Distance = require('../../module/Distance');
const Period = require('../../module/Period');
const NearbyDegen = require('../../module/NearbyDegen');
const Aim = require('../../module/Aim');
const Shotgun = require('../../module/Shotgun');
const StaticLaser = require('../../module/StaticLaser');

const Phases = makeEnum('ONE');

class MechanicalBossEarly extends Monster {
	constructor(x, y) {
		super(x, y, .2, .2, 22);
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.addModules();

		this.attackPhase = new Phase(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	addModules() {
		this.addParentsModule();
		this.addNearbyDegenModule();
		this.addFarAwayShotgunModule();
		this.addLaserModule();
		this.addShotgunFireModule();
	}

	addParentsModule() {
		this.distance = new Distance();
		this.distance.config(this, .25, .75);
		this.moduleManager.addModule(this.distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		this.period = new Period();
		this.period.config(100, 200, 100, 200);
		this.moduleManager.addModule(this.period, {[Phases.ONE]: Period.Stages.LOOP});
	}

	addNearbyDegenModule() {
		let nearbyDegenPeriod = new Period();
		nearbyDegenPeriod.config(50, 150, 1);
		nearbyDegenPeriod.periods.setPhase(2);
		this.distance.addModule(nearbyDegenPeriod, {
			0: Period.Stages.LOOP,
			1: Period.Stages.PLAY,
			2: Period.Stages.PLAY,
		});

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(this, .5, .002);
		nearbyDegenPeriod.addModule(nearbyDegen, {
			0: NearbyDegen.Stages.WARNING,
			1: NearbyDegen.Stages.ACTIVE,
			2: NearbyDegen.Stages.INACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
		});
	}

	addFarAwayShotgunModule() {
		let farAwayShotgunAim = new Aim();
		farAwayShotgunAim.config(this, 0);
		this.distance.addModule(farAwayShotgunAim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.ACTIVE,
		});

		let farAwayShotgun = new Shotgun();
		farAwayShotgun.config(this, .1, 1, .01, 0, 200, .01, farAwayShotgunAim, true);
		this.distance.addModule(farAwayShotgun, {
			0: Shotgun.Stages.INACTIVE,
			1: Shotgun.Stages.INACTIVE,
			2: Shotgun.Stages.ACTIVE,
		});
	}

	addLaserModule() {
		let laserPeriod = new Period();
		laserPeriod.config(1, 38, 1);
		this.period.addModule(laserPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.LOOP,
			2: Period.Stages.STOP,
			3: Period.Stages.STOP,
		});

		for (let i = 0; i < 3; i++) {
			let laserAim = new Aim();
			laserAim.config(this, 0, 1, .1);
			laserPeriod.addModule(laserAim, {
				0: Aim.Stages.ACTIVE,
				1: Aim.Stages.INACTIVE,
				2: Aim.Stages.INACTIVE,
			});

			let staticLaser = new StaticLaser();
			staticLaser.config(this, .005, .5, laserAim, 40, .002, .01);
			laserPeriod.addModule(staticLaser, {
				0: StaticLaser.Stages.INACTIVE,
				1: StaticLaser.Stages.WARNING,
				2: StaticLaser.Stages.ACTIVE,
			});
		}

	}

	addShotgunFireModule() {
		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(xy => {
			let shotgunAim = new Aim();
			shotgunAim.config(this, 0, 0, 0, new Vector(...xy));
			this.period.addModule(shotgunAim, {
				0: Aim.Stages.INACTIVE,
				1: Aim.Stages.INACTIVE,
				2: Aim.Stages.INACTIVE,
				3: Aim.Stages.INACTIVE,
			});

			let shotgun = new Shotgun();
			shotgun.config(this, .1, 1, .005, .002, 100, .04, shotgunAim, true);
			this.period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.INACTIVE,
				2: Shotgun.Stages.INACTIVE,
				3: Shotgun.Stages.ACTIVE,
			});
		});
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = MechanicalBossEarly;

// todo [high] rotation

},{"../../../graphics/Rect1DotsShip":60,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Phase":105,"../../../util/Vector":107,"../../module/Aim":26,"../../module/Distance":31,"../../module/NearbyDegen":34,"../../module/Period":36,"../../module/Shotgun":39,"../../module/StaticLaser":40,".././Monster":43}],51:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const SplitDiamondShip = require('../../../graphics/SplitDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const Chase = require('../../module/Chase');
const Cooldown = require('../../module/Cooldown');
const Shotgun = require('../../module/Shotgun');

const Phases = makeEnum('ONE');

class SniperTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .6);
		this.setGraphics(new SplitDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .5, .7, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let chaseAim = new Aim();
		chaseAim.config(this, PI / 20, 100, 1);
		distance.addModule(chaseAim, {
			0: Aim.Stages.REVERSE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.ACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, chaseAim);
		distance.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.ACTIVE,
			3: Chase.Stages.INACTIVE,
		});

		let cooldown = new Cooldown();
		cooldown.config(200);
		distance.addModule(cooldown, {
			0: Cooldown.Stages.ACTIVE,
			1: Cooldown.Stages.ACTIVE,
			2: Cooldown.Stages.COOLDOWN,
			3: Cooldown.Stages.COOLDOWN,
		});

		let shotgunAim = new Aim();
		shotgunAim.config(this);
		cooldown.addModule(shotgunAim, {
			[Cooldown.Phases.UNTRIGGERED]: Shotgun.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: Shotgun.Stages.ACTIVE,
		});

		let shotgun = new Shotgun();
		shotgun.config(this, 1, 1, .01, .001, 100, .06, shotgunAim);
		cooldown.addModule(shotgun, {
			[Cooldown.Phases.UNTRIGGERED]: Shotgun.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: Shotgun.Stages.ACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = SniperTick;

},{"../../../graphics/SplitDiamondShip":64,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Number":104,"../../../util/Phase":105,"../../module/Aim":26,"../../module/Chase":28,"../../module/Cooldown":29,"../../module/Distance":31,"../../module/Shotgun":39,".././Monster":43}],52:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect4DotsShip = require('../../../graphics/Rect4DotsShip');
const Phase = require('../../../util/Phase');
const Vector = require('../../../util/Vector');
const Period = require('../../module/Period');
const Aim = require('../../module/Aim');
const Shotgun = require('../../module/Shotgun');

const Phases = makeEnum('ONE');

class Static4DirTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 1.6);
		this.setGraphics(new Rect4DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(120, 80);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		[
			{x: 1, y: 0},
			{x: 0, y: 1},
			{x: -1, y: 0},
			{x: 0, y: -1},
		].forEach(dir => {
			let aim = new Aim();
			aim.config(this, 0, 0, 0, Vector.fromObj(dir));
			period.addModule(aim, {
				0: Aim.Stages.INACTIVE,
				1: Aim.Stages.INACTIVE,
			});

			let shotgun = new Shotgun();
			shotgun.config(this, .05, 1, .003, .0001, 100, .04, aim, true);
			period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.ACTIVE,
			});
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Static4DirTurret;

},{"../../../graphics/Rect4DotsShip":61,"../../../util/Constants":97,"../../../util/Enum":99,"../../../util/Phase":105,"../../../util/Vector":107,"../../module/Aim":26,"../../module/Period":36,"../../module/Shotgun":39,".././Monster":43}],53:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

class DamageDust extends Entity {
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
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {fill: true, color: Colors.Entity.DAMAGE_DUST.get()}));
	}

}

module.exports = DamageDust;

},{"../../intersection/IntersectionFinder":71,"../../painter/RectC":91,"../../util/Constants":97,"../Entity":16}],54:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
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
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: Colors.Entity.DUST.get()}));
	}

}

module.exports = Dust;

},{"../../intersection/IntersectionFinder":71,"../../painter/RectC":91,"../../util/Constants":97,"../Entity":16}],55:[function(require,module,exports){
const Graphics = require('./Graphics');

const POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

class DiamondShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = DiamondShip;

},{"./Graphics":57}],56:[function(require,module,exports){
const Graphics = require('./Graphics');

const POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

class DoubleHorizDiamond extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPathXY(-width/2, 0, width, height, POINTS, true, graphicOptions);
		this.addPathXY(width/2, 0, width, height, POINTS, true, graphicOptions);
	}
}

module.exports = DoubleHorizDiamond;

},{"./Graphics":57}],57:[function(require,module,exports){
const PathCreator = require('./PathCreator');

class Graphics {
	constructor() {
		this.pathCreators = [];
	}

	// todo [medium] deprecated and replace with addPathXY
	addPath(width, height, points, closed, {fill, color, thickness} = {}) {
		let pathCreator = new PathCreator();
		pathCreator.setFill(fill);
		pathCreator.setColor(color);
		pathCreator.setThickness(thickness);
		pathCreator.setScale(width, height, Graphics.calculateScale(points));
		pathCreator.setClosed(closed);
		points.forEach(point => pathCreator.moveTo(...point));
		this.pathCreators.push(pathCreator);
	}

	addPathXY(x, y, width, height, points, closed, {fill, color, thickness} = {}) {
		let pathCreator = new PathCreator();
		pathCreator.setFill(fill);
		pathCreator.setColor(color);
		pathCreator.setThickness(thickness);
		pathCreator.setTranslation(x, y);
		pathCreator.setScale(width, height, Graphics.calculateScale(points));
		pathCreator.setClosed(closed);
		points.forEach(point => pathCreator.moveTo(...point));
		this.pathCreators.push(pathCreator);
	}

	paint(painter, camera, x, y, moveDirection) {
		this.pathCreators.forEach(pathCreator => {
			pathCreator.setCamera(camera);
			pathCreator.setCenter(x, y);
			pathCreator.setForward(moveDirection.x, moveDirection.y);
			painter.add(pathCreator.create());
		});
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

},{"./PathCreator":59}],58:[function(require,module,exports){
const PathCreator = require('./PathCreator');
const Graphics = require('./Graphics');

const POINTS = PathCreator.createCirclePoints();

class HexagonShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = HexagonShip;

},{"./Graphics":57,"./PathCreator":59}],59:[function(require,module,exports){
const Path = require('../painter/Path');
const {PI2, thetaToVector} = require('../util/Number');

class PathCreator {
	constructor() {
		this.sx = .1; // todo [low] necessary or guaranteed to be overwritten?
		this.sy = .1;
		this.tx = 0;
		this.ty = 0;
		this.fx = 0;
		this.fy = -1;
		this.cx = 0;
		this.cy = 0;

		this.xys = [];
		this.x = 0;
		this.y = 0;
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

	setScale(x, y, s) {
		this.sx = x * s;
		this.sy = y * s;
		this.ss = (x + y) / 2 * s;
	}

	setTranslation(x, y) {
		this.tx = x;
		this.ty = y;
	}

	setForward(x, y) {
		this.fx = x;
		this.fy = y;
	}

	setCenter(x, y) {
		this.cx = x;
		this.cy = y;
	}

	setClosed(closed) {
		this.closed = closed;
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
		let pathPoints = this.computePathPoints();
		let thickness = this.computeThickness();
		return new Path(pathPoints, this.closed, {fill: this.fill, color: this.color, thickness});
	}

	computePathPoints() {
		// [0, 1] maps to center + forward
		let pathPoints = [];
		this.xys.forEach(([x, y]) => {
			x = x * this.sx + this.tx;
			y = y * this.sy + this.ty;
			let pathX = this.cx + this.fx * y - this.fy * x;
			let pathY = this.cy + this.fy * y + this.fx * x;
			pathPoints.push([this.camera.xt(pathX), this.camera.yt(pathY)]);
		});
		return pathPoints;
	}

	computeThickness() {
		return this.camera.st(this.thickness * this.ss);
	}

	// todo [medium] use this everywhere where useful
	static createCirclePoints(r = 1, n = 6, x = 0, y = 0) {
		let points = [];
		for (let i = 0; i < n; i++) {
			let theta = i * PI2 / n;
			let vector = thetaToVector(theta, r);
			points.push([x + vector[0], y + vector[1]]);
		}
		return points;
	};
}

module.exports = PathCreator;

},{"../painter/Path":89,"../util/Number":104}],60:[function(require,module,exports){
const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

const DOT_SCALE = .2;
const DOT_POS = .2;
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 0, 0);
const DOT_COLOR = Color.from1(1, 1, 1).get();

class Rect4DotsShip extends Graphics {
	constructor(width, height, color) {
		super();
		this.addPath(width, height, RECT_POINTS, true, {fill: true, color});
		this.addPathXY(
			0, height * DOT_POS,
			width * DOT_SCALE, height * DOT_SCALE,
			DOT_POINTS, true, {fill: true, color: DOT_COLOR});
	}
}

module.exports = Rect4DotsShip;

},{"../util/Color":96,"./Graphics":57,"./PathCreator":59}],61:[function(require,module,exports){
const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

const DOT_SCALE = .15;
const DOT_POS = .25;
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 0, 0);
const DOT_COLOR = Color.from1(1, 1, 1).get();

class Rect4DotsShip extends Graphics {
	constructor(width, height, color) {
		super();
		this.addPath(width, height, RECT_POINTS, true, {fill: true, color});
		RECT_POINTS.forEach(([x, y]) =>
			this.addPathXY(
				x * width * DOT_POS, y * height * DOT_POS,
				width * DOT_SCALE, height * DOT_SCALE,
				DOT_POINTS, true, {fill: true, color: DOT_COLOR}));
	}
}

module.exports = Rect4DotsShip;

},{"../util/Color":96,"./Graphics":57,"./PathCreator":59}],62:[function(require,module,exports){
const Graphics = require('./Graphics');

class RectGraphic extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		let rect = [
			[-1, -1],
			[-1, 1],
			[1, 1],
			[1, -1]];
		this.addPath(width, height, rect, true, graphicOptions);
	}
}

module.exports = RectGraphic;

},{"./Graphics":57}],63:[function(require,module,exports){
const Graphics = require('./Graphics');
const {PI2, thetaToVector, rand} = require('../util/Number');

// min magnitude of all points will be MIN_MAGNITUDE / (MIN_MAGNITUDE + 1)
const POINTS = 5, MIN_MAGNITUDE = 1;

class RockGraphic extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		let points = [];
		for (let i = 0; i < POINTS; i++)
			points.push(thetaToVector(i * PI2 / POINTS, rand() + MIN_MAGNITUDE));
		this.addPath(width, height, points, true, graphicOptions);
	}
}

module.exports = RockGraphic;

},{"../util/Number":104,"./Graphics":57}],64:[function(require,module,exports){
const Graphics = require('./Graphics');

const DIAMOND_POINTS = [
	[0, 1.5],
	[1, 0],
	[0, -1.5],
	[-1, 0]];

// const SPLIT_POINTS = [
// 	[-1, 0],
// 	[1, 0]];

class SplitDiamondShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, DIAMOND_POINTS, true, graphicOptions);
		// this.addPath(width, height, SPLIT_POINTS, false, {color: 'rgb(255,0,255)'});
	}
}

module.exports = SplitDiamondShip;

},{"./Graphics":57}],65:[function(require,module,exports){
const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const POINTS = PathCreator.createCirclePoints();
const COLOR = Color.from255(240, 200, 230).get();

class TestShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, POINTS, true,
			{fill: true, color: COLOR});
	}
}

module.exports = TestShip;

},{"../util/Color":96,"./Graphics":57,"./PathCreator":59}],66:[function(require,module,exports){
const Graphics = require('./Graphics');

const POINTS = [
	[0, 3], // front
	[2, -1], // right
	[0, -3], // back
	[-2, -1]]; // left

class VShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = VShip;

},{"./Graphics":57}],67:[function(require,module,exports){
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
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = WShip;

},{"./Graphics":57}],68:[function(require,module,exports){
const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const {Colors} = require('../util/Constants');
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
		let {x, y} = controller.getRawMouse();

		if (!this.bounds.inside(x, y))
			this.state = States.INACTIVE;
		else
			this.state = controller.getMouseState().active ? States.ACTIVE : States.HOVER;
	}

	paint(painter) {
		let color = [Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;

},{"../painter/Rect":90,"../painter/Text":92,"../util/Constants":97,"../util/Enum":99,"./Interface":69}],69:[function(require,module,exports){
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

},{"../intersection/Bounds":70}],70:[function(require,module,exports){
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

},{"../util/Enum":99}],71:[function(require,module,exports){
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

const CollisionTypes = makeEnum(
	'OFF', // unused, unset/undefined instead
	'ON',
	'TRACK_ONLY', // tracks collisions but does not prevent movement
);

class IntersectionFinder {
	constructor() {
		this.collisions = Object.keys(Layers).map(() => []);
		this.boundsGroups = Object.keys(Layers).map(() => new LinkedList());

		this.initCollisions();
	}

	initCollisions() {
		// todo [med] allow units to move through projectiles, while taking damage
		// passives intersect with everything
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_UNIT);

		// Projectiles intersect with opposing units un-symmetrically
		this.addCollision(Layers.FRIENDLY_PROJECTILE, Layers.HOSTILE_UNIT, false);
		this.addCollision(Layers.HOSTILE_PROJECTILE, Layers.FRIENDLY_UNIT, false);

		// friendly units intersect with hostile units
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_UNIT);

		// hostile units intersects with hostile units
		this.addCollision(Layers.HOSTILE_UNIT, Layers.HOSTILE_UNIT);
	}

	addCollision(layer1, layer2, symmetric = true) {
		this.collisions[layer1][layer2] = CollisionTypes.ON;
		this.collisions[layer2][layer1] = symmetric ? CollisionTypes.ON : CollisionTypes.TRACK_ONLY;
	}

	addBounds(layer, bounds, reference) {
		return this.boundsGroups[layer].add({bounds, reference})
	}

	removeBounds(layer, item) {
		return this.boundsGroups[layer].remove(item);
	}

	hasIntersection(searchLayer, bounds) {
		let item = this.boundsGroups[searchLayer]
			.find(({bounds: iBounds}) => iBounds.intersects(bounds));
		return item && item.value.reference;
	}

	intersections(layer, bounds) {
		return this.collisions[layer].flatMap((_, iLayer) =>
			this.boundsGroups[iLayer]
				.filter(({bounds: iBounds}) => iBounds.intersects(bounds))
				.map(item => item.value.reference));
	}

	canMove(layer, bounds, dx, dy, magnitude, noSlide) {
		// if magnitude is -1, then <dx, dy> is not necessarily a unit vector, and its magnitude should be used
		if (magnitude === -1)
			({x: dx, y: dy, prevMagnitude: magnitude} = setMagnitude(dx, dy));

		if (!dx && !dy || magnitude <= 0)
			return {x: 0, y: 0, reference: [], trackedOnlyReferences: []};

		let moveX = 0, moveY = 0;

		let horizontal = dx <= 0 ? Bounds.Directions.LEFT : Bounds.Directions.RIGHT;
		let vertical = dy <= 0 ? Bounds.Directions.TOP : Bounds.Directions.BOTTOM;

		let intersectionReference, trackedOnlyReferences = [];
		if (dx && dy) {
			let {move, side, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackedOnlyReferences);

			moveX += dx * move;
			moveY += dy * move;
			magnitude -= move;

			if (!side || noSlide) {
				trackedOnlyReferences = trackedOnlyReferences.filter(([_, move]) => move <= magnitude).map(([reference]) => reference);
				return {x: moveX, y: moveY, reference, trackedOnlyReferences};
			} else if (side === 1) {
				horizontal = Bounds.Directions.LEFT;
				dx = 0;
			} else {
				vertical = Bounds.Directions.TOP;
				dy = 0;
			}

			intersectionReference = reference;
		}

		let {move, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackedOnlyReferences);
		moveX += dx * move;
		moveY += dy * move;
		magnitude -= move;
		trackedOnlyReferences = trackedOnlyReferences.filter(([_, move]) => move <= magnitude).map(([reference]) => reference);

		return {x: moveX, y: moveY, reference: intersectionReference || reference, trackedOnlyReferences};
		// todo [low] return list of all intersection references
	}

	// moves bounds until intersecting of type ON
	// returns similar to checkMoveEntityIntersection in addition to reference, the closest ON collision type
	// trackOnlyReferencesSuperset is an output array that will be appended to for all TRACK_ONLY collisions encountered
	// trackOnlyReferencesSuperset will be partially filtered by distance < reference
	checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackOnlyReferencesSuperset) {
		let side, reference;

		this.collisions[layer].forEach((collisionType, iLayer) =>
			this.boundsGroups[iLayer].forEach(({bounds: iBounds, reference: iReference}) => {
				if (iBounds === bounds)
					return;
				let iIntersection = IntersectionFinder.checkMoveEntityIntersection(bounds, dx, dy, magnitude, horizontal, vertical, iBounds);
				if (iIntersection)
					if (collisionType === CollisionTypes.ON) {
						({move: magnitude, side} = iIntersection);
						reference = iReference;
					} else
						trackOnlyReferencesSuperset.push([iReference, iIntersection.move])
			}));

		return {move: magnitude, side, reference};
	}

	// checks for intersection between bounds + movement & ibounds
	// returns undefined if no intersection
	// returns {move: how much can move until intersection, side: which side the intersection occurred (0 = none, 1 = horizontal, 2 = vertical)}
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

},{"../util/Enum":99,"../util/LinkedList":102,"../util/Number":104,"./Bounds":70}],72:[function(require,module,exports){
const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const Player = require('../entities/Player');
const MonsterKnowledge = require('../entities/monsters/MonsterKnowledge');
const MapGenerator = require('../map/MapGeneratorArena');
const Minimap = require('../map/Minimap');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.map = new Map();
		this.player = new Player();
		this.monsterKnowledge = new MonsterKnowledge();
		this.monsterKnowledge.setPlayer(this.player);
		this.mapGenerator = new MapGenerator(this.map, this.player);
		this.mapGenerator.generate();
		this.minimap = new Minimap(this.map);
		this.camera = new Camera(this.player.x, this.player.y);
		this.starfield = new Starfield(...this.map.getSize());
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.updateCamera();
		this.controller.inverseTransformMouse(this.camera);
		this.mapGenerator.update();
		this.map.update(this.controller, this.monsterKnowledge);
		this.minimap.update(this.controller);
	}

	updateCamera() {
		this.camera.move(this.player, this.controller.getRawMouse(.5, .5));
		this.camera.zoom(
			Keymapping.getControlState(this.controller, Keymapping.Controls.ZOOM_OUT).active,
			Keymapping.getControlState(this.controller, Keymapping.Controls.ZOOM_IN).active);
	}

	paint() {
		this.starfield.paint(this.painterSet.painter, this.camera);
		this.map.paint(this.painterSet.painter, this.camera);
		if (UI) {
			this.minimap.paint(this.painterSet.uiPainter);
			this.map.paintUi(this.painterSet.uiPainter, this.camera);
		}
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
// consider restructuring packages. src>abilities & src>entities>module r symmetric

// todo [monster]
// skirmersher
// laser, short range raiders
// latchers that reduce max health
// linkers that reduce speed and drain health
// traps
// dots

},{"../camera/Camera":11,"../control/Keymapping":13,"../entities/Player":19,"../entities/monsters/MonsterKnowledge":44,"../map/Map":80,"../map/MapGeneratorArena":81,"../map/Minimap":82,"../starfield/Starfield":94,"./Logic":75}],73:[function(require,module,exports){
const Logic = require('./Logic');
const TestShip = require('../graphics/TestShip');
const {thetaToVector} = require('../util/Number');

const idf = a => a;

class GraphicsDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.w = .2;
		this.h = .2;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .05 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h);
		this.fakeCamera = {xt: idf, yt: idf, st: idf};
	}

	iterate() {
		this.ship = new TestShip(this.w, this.h); // makes it easy to plug in window variables in constructor to edit live
		let direction = thetaToVector(this.theta += this.dtheta);
		this.ship.paint(this.painterSet.painter, this.fakeCamera, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

module.exports = GraphicsDemo;

},{"../graphics/TestShip":65,"../util/Number":104,"./Logic":75}],74:[function(require,module,exports){
const Logic = require('./Logic');
const Button = require('../interface/Button');

class InterfaceDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.interface = new Button();
		this.interface.setPosition(.25, .25, .2, .04);
	}

	iterate() {
		this.interface.update(this.controller);
		this.interface.paint(this.painterSet.uiPainter);
	}
}

module.exports = InterfaceDemo;

},{"../interface/Button":68,"./Logic":75}],75:[function(require,module,exports){
class Logic {
	constructor(controller, painterSet) {
		this.controller = controller;
		this.painterSet = painterSet;
	}

	iterate() {
	}
}

module.exports = Logic;

},{}],76:[function(require,module,exports){
const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
const FpsTracker = require('../util/FpsTracker');
const Text = require('../painter/Text');

class Looper {
	static sleep(milli) {
		return new Promise(resolve => setTimeout(resolve, milli))
	}

	constructor(canvas) {
		this.canvas = canvas;
		this.controller = new Controller(canvas);
		this.painterSet = new PainterCompositor(canvas);
		this.fpsTracker = new FpsTracker();
		this.loop();
	}

	setLogicClass(LogicClass) {
		this.logic = new LogicClass(this.controller, this.painterSet);
	}

	async loop() {
		while (true) {
			await Looper.sleep(10);
			if (!this.logic)
				continue;
			this.painterSet.clear();
			this.logic.iterate();
			this.painterSet.uiPainter.add(new Text(.97, .03, this.fpsTracker.getFps()));
			this.painterSet.paint();
			this.controller.expire();
		}
	}
}

module.exports = Looper;

},{"../control/Controller":12,"../painter/PainterCompositor":87,"../painter/Text":92,"../util/FpsTracker":100}],77:[function(require,module,exports){
const LinkedList = require('../util/LinkedList');
const Entity = require('../entities/Entity');
const Logic = require('./Logic');
const MapGenerator = require('../map/MapGeneratorArena');
const Camera = require('../camera/Camera');
const Color = require('../util/Color');
const RectC = require('../painter/RectC');

class FakePlayer {
	setPosition() {
	}
}

class FakeMap {
	constructor() {
		this.stills = new LinkedList();
		this.monsters = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}

	addStill(still) {
		this.stills.add(still);
	}

	addPlayer(player) {
	}

	addMonster(monster) {
		this.monsters.add(monster);
	}

	addUi(ui) {
	}

	paint(painter, camera) {
		this.stills.forEach(still => still.paint(painter, camera));
		this.monsters.forEach(monster => Entity.prototype.paint.call(monster, painter, camera)); // to avoid painting modules
	}
}

class MapDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.reset();
		this.camera = new Camera(this.map.width / 2, this.map.height / 2, (this.map.width + this.map.height) / 2);
	}

	reset() {
		this.map = new FakeMap();
		this.player = new FakePlayer();
		new MapGenerator(this.map, this.player).generate();
	}

	iterate() {
		if (this.controller.getKeyState(' ').pressed)
			this.reset();

		this.updateCamera();

		this.painterSet.uiPainter.add(RectC.withCamera(this.camera, this.map.width / 2, this.map.height / 2, this.map.width, this.map.height, {color: Color.WHITE.get(), thickness: 2}));
		this.map.paint(this.painterSet.uiPainter, this.camera);
	}

	updateCamera() {
		let {x, y} = this.controller.getRawMouse(.5, .5);
		this.camera.move({x: x * this.map.width, y: y * this.map.height}, {x, y});
		this.camera.zoom(this.controller.getKeyState('z').active, this.controller.getKeyState('x').active);
	}
}

module.exports = MapDemo;

},{"../camera/Camera":11,"../entities/Entity":16,"../map/MapGeneratorArena":81,"../painter/RectC":91,"../util/Color":96,"../util/LinkedList":102,"./Logic":75}],78:[function(require,module,exports){
const Logic = require('./Logic');
const {NoiseSimplex} = require('../util/Noise');
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
	constructor(controller, painterSet) {
		super(controller, painterSet);
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
					this.painterSet.uiPainter.add(new Rect(x * NTH, y * NTH, 1 / N, 1 / N, {fill: true, color: Color.BLACK.get()}));
					this.painterSet.uiPainter.add(new RectC(.1, .1, .03, .03, {fill: true, color: `#fff`}));
					this.painterSet.uiPainter.add(new Text(.1, .1, this.noiseRange));
				}
			}
	}
}

module.exports = NoiseDemo;

},{"../painter/Rect":90,"../painter/RectC":91,"../painter/Text":92,"../util/Color":96,"../util/Noise":103,"../util/Number":104,"./Logic":75}],79:[function(require,module,exports){
const Logic = require('./Logic');
const Camera = require('../camera/Camera');
const Color = require('../util/Color');
const Text = require('../painter/Text');
const Starfield = require('../starfield/Starfield');
const StarfieldNoise = require('../starfield/StarfieldNoise');

class StarfieldDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.camera = new Camera(0, 0, 1);
	}

	iterate() {
		this.periodicallySwapStarfield();
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
		this.starfield.paint(this.painterSet.uiPainter, this.camera);
		this.painterSet.uiPainter.add(new Text(.05, .05, this.noise ? 'noise' : 'rand', {color: Color.WHITE.get()}));
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

},{"../camera/Camera":11,"../painter/Text":92,"../starfield/Starfield":94,"../starfield/StarfieldNoise":95,"../util/Color":96,"./Logic":75}],80:[function(require,module,exports){
const IntersectionFinder = require('../intersection/IntersectionFinder');
const LinkedList = require('../util/LinkedList');
const Bounds = require('../intersection/Bounds');
const Rect = require('../painter/Rect');

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
		this.stills = new LinkedList();
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

	addStill(still) {
		this.stills.add(still);
		still.addIntersectionBounds(this.intersectionFinder);
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

	addUi(ui) {
		this.uis.add(ui);
	}

	addProjectile(projectile) { // todo [med] rename to addAttack or such
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	addParticle(particle) {
		this.particles.add(particle);
	}

	update(controller, monsterKnowledge) {
		this.player.update(this, controller, this.intersectionFinder, monsterKnowledge);
		this.monsters.forEach((monster, item) => {
			if (monster.health.isEmpty()) {
				this.monsters.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
			} else
				monster.update(this, this.intersectionFinder, monsterKnowledge);
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
		this.stills.forEach(still => still.paint(painter, camera));
		this.player.paint(painter, camera);
		this.monsters.forEach(monster => monster.paint(painter, camera));
		this.projectiles.forEach(projectile => projectile.paint(painter, camera));
		this.particles.forEach(particle => particle.paint(painter, camera));
	}

	paintUi(painter, camera) {
		this.uis.forEach((ui, iter) => {
			if (ui.removeUi())
				this.uis.remove(iter);
			else
				ui.paintUi(painter, camera);
		});
	}
}

module.exports = Map;

// todo [medium] consider static & dynamic entity lists in stead of individual type entity lists

},{"../intersection/Bounds":70,"../intersection/IntersectionFinder":71,"../painter/Rect":90,"../util/LinkedList":102}],81:[function(require,module,exports){
const {NoiseSimplex} = require('../util/Noise');
const {rand, round} = require('../util/Number');
const MapBoundary = require('../entities/MapBoundary');
const Rock = require('../entities/Rock');
const RockMineral = require('../entities/RockMineral');
const Champion = require('../entities/monsters/Champion');
const ExplodingTick = require('../entities/monsters/mechanicalFaction/ExplodingTick');
const SniperTick = require('../entities/monsters/mechanicalFaction/SniperTick');
const Static4DirTurret = require('../entities/monsters/mechanicalFaction/Static4DirTurret');
const AimingLaserTurret = require('../entities/monsters/mechanicalFaction/AimingLaserTurret');
const MechanicalBossEarly = require('../entities/monsters/mechanicalFaction/MechanicalBossEarly');
const BombLayer = require('../entities/monsters/mechanicalFaction/BombLayer');
const DashChaser = require('../entities/monsters/mechanicalFaction/DashChaser');
const MechanicalBoss = require('../entities/monsters/mechanicalFaction/MechanicalBoss');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const STAGE_SPAWNS = [
	// [
	// 	[MechanicalBossEarly, 1],
	// ],
	// [
	// 	[MechanicalBoss, 1],
	// ],
	[
		[ExplodingTick, 3],
	],
	[
		[ExplodingTick, 2],
		[SniperTick, 2],
	],
	[
		[Static4DirTurret, 3],
		[AimingLaserTurret, 2],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 2],
	],
	[
		[MechanicalBossEarly, 1],
	],
	[
		[BombLayer, 3],
		[DashChaser, 4],
	],
	[
		[AimingLaserTurret, 2],
		[BombLayer, 4],
		[DashChaser, 3],
	],
	[
		[SniperTick, 3],
		[Static4DirTurret, 3],
		[AimingLaserTurret, 3],
		[BombLayer, 3],
		[DashChaser, 3],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 4],
		[AimingLaserTurret, 4],
		[BombLayer, 4],
		[DashChaser, 4],
	],
	[
		[MechanicalBoss, 1],
	],
	[
		[ExplodingTick, 4],
		[SniperTick, 4],
		[Static4DirTurret, 4],
		[AimingLaserTurret, 4],
		[BombLayer, 4],
		[DashChaser, 4],
	],
];

class MapGeneratorArena {
	constructor(map, player) {
		const OCCUPIED_NOISE = 2, ROCK_NOISE = 5;

		this.occupiedNoise = new NoiseSimplex(OCCUPIED_NOISE);
		this.rockNoise = new NoiseSimplex(ROCK_NOISE);

		this.map = map;
		this.player = player;
	}

	generate() {
		this.map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.stageEntities = [];
		this.stage = 0;
		this.timer = 0;

		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		this.map.addPlayer(this.player);
		this.map.addUi(this);
	}

	update() {
		this.timer++;
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			let entities = this.createMonsters(this.stage++);
			entities.forEach(([entity, ui]) => {
				while (!entity.checkPosition(this.map.intersectionFinder)) {
					let position = this.occupiedNoise.positions(1, WIDTH, HEIGHT)[0];
					entity.setPosition(...position);
				}
				this.map.addMonster(entity, ui);
			});
			this.stageEntities = entities.map(([entity]) => entity);
		}
	}

	generateBoundaries() {
		MapBoundary.createBoxBoundaries(WIDTH, HEIGHT).forEach(mapBoundary => this.map.addStill(mapBoundary));
	}

	generateRocks() {
		const ROCKS = 3, ROCK_MINERALS = 1;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	createMonsters(stage) {
		let spawns = STAGE_SPAWNS[Math.min(stage, STAGE_SPAWNS.length - 1)];
		let multiplier = Math.max(stage - STAGE_SPAWNS.length + 2, 1);
		return spawns.map(([MonsterClass, count]) =>
			[...Array(count * multiplier)]
				.map(() => [new MonsterClass(), false]))
			.flat();
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${this.stage} : ${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGeneratorArena;

/*
123456

1
12
34
123

56
456
23456 - 1
124356

OR
123456
123456
123456
123456

1
12
34
123

456
2356
2456
13456

exploding tick          degen while moving
sniper tick             shot leaves temporary spheres in trail
fixed 4-way turret      alternates to diagonal
aiming 1-way turret     triple laser
bomb layer
charger

melee dart
melee dart spawner ship
degen turret or turret with spinning degen tiny mobs
turret with static & inactive tiny mobs, that periodically charge the player with slow rotation
wall of projectiles
frontal degen rectangle

melee slow debuff
ranged heal allies debuff
spinning turret
delayed missile turret
encircling circle fo bombs
rapid firing, slow moving, short range projectile machine gun

game modes: defense, boss fights, kill outpost portals, and arena
*/

},{"../entities/MapBoundary":18,"../entities/Rock":20,"../entities/RockMineral":21,"../entities/monsters/Champion":42,"../entities/monsters/mechanicalFaction/AimingLaserTurret":45,"../entities/monsters/mechanicalFaction/BombLayer":46,"../entities/monsters/mechanicalFaction/DashChaser":47,"../entities/monsters/mechanicalFaction/ExplodingTick":48,"../entities/monsters/mechanicalFaction/MechanicalBoss":49,"../entities/monsters/mechanicalFaction/MechanicalBossEarly":50,"../entities/monsters/mechanicalFaction/SniperTick":51,"../entities/monsters/mechanicalFaction/Static4DirTurret":52,"../painter/Text":92,"../util/Constants":97,"../util/Noise":103,"../util/Number":104}],82:[function(require,module,exports){
const Keymapping = require('../control/Keymapping');
const Camera = require('../camera/Camera');
const {Colors} = require('../util/Constants');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Minimap {
	constructor(map) {
		this.map = map;
	}

	toggleZoom() {
		this.zoom = !this.zoom;
	}

	update(controller) {
		if (Keymapping.getControlState(controller, Keymapping.Controls.MINIMAP_ZOOM).pressed)
			this.toggleZoom();
	}

	createCamera() {
		const OFFSET = .01, SCALE_BASE_SMALL = .15, SCALE_BASE_LARGE = .4;
		let scale = (this.zoom ? SCALE_BASE_LARGE : SCALE_BASE_SMALL);
		return Camera.createForRegion(this.map.width, OFFSET, OFFSET, scale);
	}

	paint(painter) {
		let camera = this.createCamera();
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: true, color: Colors.Minimap.BACKGROUND.get()}));
		painter.add(Rect.withCamera(camera, 0, 0, this.map.width, this.map.height, {fill: false, color: Colors.Minimap.BORDER.get()}));
		this.map.stills.forEach(rock => this.paintDot(painter, camera, rock.x, rock.y, Colors.Minimap.ROCK.get()));
		this.map.monsters.forEach(monster => this.paintDot(painter, camera, monster.x, monster.y, Colors.Minimap.MONSTER.get()));
		this.map.uis.forEach(ui => this.paintDot(painter, camera, ui.x, ui.y, Colors.Minimap.BOSS.get()));
		this.paintDot(painter, camera, this.map.player.x, this.map.player.y, Colors.Minimap.PLAYER.get());
	}

	paintDot(painter, camera, x, y, color) {
		const DOT_SIZE = .02 * this.map.width;
		painter.add(RectC.withCamera(camera, x, y, DOT_SIZE, DOT_SIZE, {fill: true, color}));
	}
}

module.exports = Minimap;

},{"../camera/Camera":11,"../control/Keymapping":13,"../painter/Rect":90,"../painter/RectC":91,"../util/Constants":97}],83:[function(require,module,exports){
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

},{"./PainterElement":88,"./Rect":90}],84:[function(require,module,exports){
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

},{"./PainterElement":88,"./Rect":90}],85:[function(require,module,exports){
const Path = require('./Path');
const Vector = require('../util/Vector');

class Line extends Path {
	constructor(x, y, x2, y2, width, graphicOptions) {
		let w = new Vector(x2 - x, y2 - y).rotateByCosSin(0, 1);
		w.magnitude = width;
		let xys = [
			[x - w.x, y - w.y],
			[x + w.x, y + w.y],
			[x2 + w.x, y2 + w.y],
			[x2 - w.x, y2 - w.y],
		];
		super(xys, true, graphicOptions);
	}

	static withCamera(camera, x, y, x2, y2, width, {fill, color, thickness} = {}) {
		return new Line(camera.xt(x), camera.yt(y), camera.xt(x2), camera.yt(y2), camera.st(width), {fill, color, thickness: camera.st(thickness)});
	}
}

module.exports = Line;

},{"../util/Vector":107,"./Path":89}],86:[function(require,module,exports){
class Painter {
	constructor(width, height) {
		this.canvas = Painter.createCanvas(width, height);
		this.width = width;
		this.height = height;
		this.xCoordinateTransform = x => x * width;
		this.yCoordinateTransform = y => y * height;
		this.context = this.canvas.getContext('2d');
		this.setFontMode();
		this.elements = []; // todo [medium] test linked list instead of array for performance
	}

	static createCanvas(width, height) {
		let canvas = document.createElement('canvas'); // todo [low] better way of creating context
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	setFontMode() {
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
	}
}

module.exports = Painter;

},{}],87:[function(require,module,exports){
const Painter = require('./Painter');

class PainterCompositor {
	constructor(canvas) {
		this.width = canvas.width;
		this.height = canvas.height;
		this.context = canvas.getContext('2d');
		this.painter = new Painter(this.width, this.height);
		this.uiPainter = new Painter(this.width, this.height);
	}

	clear() {
		this.painter.clear();
		this.uiPainter.clear();
	}

	paint() {
		this.painter.paint();
		this.uiPainter.paint();

		this.context.clearRect(0, 0, this.width, this.height);
		this.context.drawImage(this.painter.canvas, 0, 0);
		this.context.drawImage(this.uiPainter.canvas, 0, 0);
	}
}

module.exports = PainterCompositor;

},{"./Painter":86}],88:[function(require,module,exports){
const Color = require('../util/Color');

class PainterElement {
	setFillMode(context) {
		context.fillStyle = this.color;
	}

	setLineMode(context) {
		context.strokeStyle = this.color;
		context.lineWidth = this.thickness || 1;
	}

	setDoubleMode(context) {
		context.strokeStyle = Color.from1(0, 0, 0).get();
		context.lineWidth = 1;
	}

	setFont(context) {
		context.textAlign = this.align;
		context.font = `${this.size} monospace`;
	}

	paint(painter) {
	}
}

module.exports = PainterElement;

},{"../util/Color":96}],89:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Path extends PainterElement {
	constructor(xys, closed, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.xys = xys;
		this.closed = closed;
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
		if (this.fill === 'double') {
			this.setDoubleMode(context);
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
		if (this.closed)
			context.closePath();
	}
}

module.exports = Path;

},{"./PainterElement":88}],90:[function(require,module,exports){
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
		return new Rect(camera.xt(x), camera.yt(y), camera.st(width), camera.st(height), {fill, color, thickness: camera.st(thickness)});
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

},{"./PainterElement":88}],91:[function(require,module,exports){
const Rect = require('./Rect');

class RectC extends Rect {
	// todo [low] refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
	constructor(centerX, centerY, width, height, graphicOptions = {}) {
		super(centerX - width / 2, centerY - height / 2, width, height, graphicOptions);
	}

	static withCamera(camera, centerX, centerY, width, height, {fill, color, thickness} = {}) {
		return new RectC(camera.xt(centerX), camera.yt(centerY), camera.st(width), camera.st(height), {fill, color, thickness: camera.st(thickness)});
	}
}

module.exports = RectC;

},{"./Rect":90}],92:[function(require,module,exports){
const PainterElement = require('./PainterElement');

class Text extends PainterElement {
	constructor(x, y, text, {color = '#000', size = '18px', align = 'center'} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
		this.size = size;
		this.align = align;
	}

	paint(xt, yt, context) {
		this.setFillMode(context);
		this.setFont(context);

		let tx = xt(this.x);
		let ty = yt(this.y);
		context.fillText(this.text, tx, ty);
	}
}

module.exports = Text;

},{"./PainterElement":88}],93:[function(require,module,exports){
const {Colors} = require('../util/Constants');
const {rand, randInt} = require('../util/Number');
const RectC = require('../painter/RectC');

const FLICKER_COLOR_MULT = .7;
const STAR_COLOR_ARRAY = [
	[Colors.Star.WHITE, Colors.Star.WHITE.multiply(FLICKER_COLOR_MULT)],
	[Colors.Star.BLUE, Colors.Star.BLUE.multiply(FLICKER_COLOR_MULT)]];

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

},{"../painter/RectC":91,"../util/Constants":97,"../util/Number":104}],94:[function(require,module,exports){
const {rand, randB} = require('../util/Number');
const Star = require('./Star');
const RectC = require('../painter/RectC');

class Starfield {
	constructor(width, height, extra = 0) {
		const DEPTH = 20 + extra * 20, FORWARD_DEPTH = .8,
			WIDTH = width * DEPTH, HEIGHT = height * DEPTH,
			COUNT = WIDTH * HEIGHT,
			SIZE = .05 + extra * .05, BLUE_RATE = .05;

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

},{"../painter/RectC":91,"../util/Number":104,"./Star":93}],95:[function(require,module,exports){
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

},{"../painter/RectC":91,"../util/Noise":103,"../util/Number":104,"./Star":93,"./Starfield":94}],96:[function(require,module,exports){
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

	avgWhite(weight = .5) {
		let iweight = 1 - weight;
		return new Color(
			this.r * iweight + weight * 255,
			this.g * iweight + weight * 255,
			this.b * iweight + weight * 255,
			this.a);
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

},{"./Number":104}],97:[function(require,module,exports){
const Color = require('./Color');

const Colors = {
	// todo [medium] structure these constants

	// bars
	BAR_SHADING: .25,
	LIFE: Color.fromHexString('#fab9b1').avgWhite(.25),
	STAMINA: Color.fromHexString('#98d494').avgWhite(.4),
	ENRAGE: Color.fromHexString('#616600'),

	TARGET_LOCK: Color.from1(.5, .5, .5),
	DAMAGE: Color.from255(255, 0, 0, .4),

	// abilities
	PLAYER_ABILITIES: [
		Color.fromHexString('#a87676').avgWhite(.4),
		Color.fromHexString('#76a876').avgWhite(.4),
		Color.fromHexString('#7676a8').avgWhite(.4),
		Color.fromHexString('#76a6a6').avgWhite(.4),
		Color.fromHexString('#a676a6').avgWhite(.4),
		Color.fromHexString('#a6a676').avgWhite(.4),
	],
	PLAYER_ABILITY_NOT_READY: Color.fromHexString('#444'),

	Interface: {
		INACTIVE: Color.from1(1, 1, 1),
		HOVER: Color.from1(.95, .95, .95),
		ACTIVE: Color.from1(1, 1, 1)
	},

	Entity: {
		MAP_BOUNDARY: Color.fromHexString('#ccc'),
		ROCK: Color.fromHexString('#888'),
		ROCK_MINERAL: Color.fromHexString('#8b8'),
		PLAYER: Color.fromHexString('#888'),
		MONSTER: Color.fromHexString('#bd6359'),
		HOSTILE_PROJECTILE: Color.fromHexString('#c66'),
		FRIENDLY_PROJECTILE: Color.fromHexString('#6c6'),
		Bomb: {
			WARNING_BORDER: Color.fromHexString('#cc8f52'),
			ENTITY: Color.fromHexString('#00c')
		},
		AREA_DEGEN: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .1)
		},
		DUST: Color.fromHexString('#ccc'),
		DAMAGE_DUST: Color.fromHexString('#f88')
	},

	Monsters: {
		OutpostPortal: {
			FILL: Color.from1(1, .9, .9),
			BORDER: Color.from1(1, .5, .5),
			LINES: Color.from1(1, .95, .95),
		}
	},

	Star: {
		WHITE: Color.from1(.7, .7, .7),
		BLUE: Color.from1(.5, .5, .75)
	},

	Minimap: {
		BACKGROUND: Color.from1(1, 1, 1, .5),
		BORDER: Color.from1(0, 0, 0, .5),
		ROCK: Color.from1(0, 0, 0),
		MONSTER: Color.from1(1, 0, 0),
		BOSS: Color.from1(1, 0, .6),
		PLAYER: Color.from1(0, 0, 1)
	}
};

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .02,
	PLAYER_BAR_X: .5,
	ABILITY_SIZE: .06,
	ABILITY_CHANNEL_BAR_SIZE: .01,
	STAGE_TEXT_HEIGHT: .03,
};

module.exports = {Colors, Positions};

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

},{"./Color":96}],98:[function(require,module,exports){
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

	decay() {
		if (this.value > 0)
			this.value = Math.max(this.value - this.decayRate, 0);
	}

	get() {
		return this.value / this.max;
	}
}

module.exports = Decay;

},{}],99:[function(require,module,exports){
const makeEnum = (...values) => {
	let enumb = {};
	values.forEach((value, index) => enumb[value] = index);
	return enumb;
};

module.exports = makeEnum;

},{}],100:[function(require,module,exports){
const {round} = require('./Number');

class FpsTracker {
	constructor() {
		this.fps = 0;
	}

	tick() {
		let now = performance.now();
		let passed = now - this.start;
		if (!(passed < 1000)) {
			this.start = now;
			this.fps = this.ticks * 1000 / passed;
			this.ticks = 0;
		}
		this.ticks++;
	}

	getFps() {
		this.tick();
		return round(this.fps);
	}
}

module.exports = FpsTracker;

},{"./Number":104}],101:[function(require,module,exports){
class Item {
    constructor(value, prev) {
        this.value = value;
        this.prev = prev;
    }
}

module.exports = Item;

},{}],102:[function(require,module,exports){
const Item = require('./Item');

class LinkedList {
	constructor() {
		this.length = 0;
	}

	add(value) {
		this.length++;
		return !this.head
			? this.tail = this.head = new Item(value)
			: this.tail = this.tail.next = new Item(value, this.tail);
	}

	remove(item) {
		this.length--;
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

	filter(handler) {
		let output = [];
		let iter = this.head;
		while (iter) {
			if (handler(iter.value, iter))
				output.push(iter);
			iter = iter.next;
		}
		return output;
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

},{"./Item":101}],103:[function(require,module,exports){
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

	// not consistent, calling it multiple times with same parameters can yield different results
	getB(x, y) {
		return this.get(x, y) > this.threshold + rand(this.thresholdRandWeight);
	}

	// return count number of positions within range [[0 - width], [0 - height]], structured as 2d array
	// not consistent, calling it multiple times with same parameters can yield different results
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
	// not consistent, calling it multiple times with same parameters can yield different results
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

},{"./Number":104,"simplex-noise":1}],104:[function(require,module,exports){
const EPSILON = 1e-10, PI = Math.PI, PI2 = PI * 2;

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

// todo [med] deprecated
// todo [medium] replace getMagnitude uses with getMagnitudeSqr where possible
const getMagnitudeSqr = ({x, y}) => x * x + y * y;

// todo [med] deprecated
const getMagnitude = (x, y) => Math.sqrt(getMagnitudeSqr({x, y}));

// todo [med] deprecated
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

// todo [med] deprecated
const thetaToVector = (theta, magnitude = 1) => [cos(theta) * magnitude, sin(theta) * magnitude];

const cos = theta => Math.cos(theta);

const sin = theta => Math.sin(theta);

const booleanArray = array => array.some(a => a);

const avg = (a, b, weight = .5) => a * weight + b * (1 - weight);

// [0, int)
const rand = (max = 1) => Math.random() * max;

const randB = (max = 1) => rand(max) - max / 2;

// [0, max)
const randInt = max => Math.floor(rand(max));

// todo [med] deprecated
const randVector = magnitude =>
	thetaToVector(rand(PI2), rand(magnitude));

// todo [med] deprecated
const vectorDelta = (a, b) => ({x: b.x - a.x, y: b.y - a.y});

// todo [med] deprecated
const vectorSum = (...vs) =>
	vs.reduce((v, sum) => ({x: sum.x + v.x, y: sum.y + v.y}), {x: 0, y: 0});

const round = (number, precision = 0) => {
	let ten = 10 ** precision;
	return Math.round(number * ten) / ten;
};

module.exports = {
	EPSILON,
	PI,
	PI2,
	maxWhich,
	getDiamondDistance,
	getRectDistance,
	getMagnitudeSqr,
	getMagnitude,
	setMagnitude,
	clamp,
	thetaToVector,
	cos,
	sin,
	booleanArray,
	avg,
	rand,
	randB,
	randInt,
	randVector,
	vectorDelta,
	vectorSum,
	round,
};

// todo [medium] consistent return {x, y} for vectors instead of [x, y] for some
// todo [medium] consistent input ({x, y}) for vectors instead of (x, y)

},{}],105:[function(require,module,exports){
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

},{"./Number":104}],106:[function(require,module,exports){
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

	getRatio() {
		return this.value / this.max;
	}

	isFull() {
		return this.value === this.max;
	}

	isEmpty() {
		return !this.value;
	}
}

module.exports = Pool;

},{"./Number":104}],107:[function(require,module,exports){
const {PI2, clamp, cos, sin, rand} = require('./Number');

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static fromObj({x, y}) {
		return new Vector(x, y);
	}

	static fromTheta(theta, magnitude = 1) {
		return new Vector(cos(theta) * magnitude, sin(theta) * magnitude);
	}

	static fromRand(maxMagnitude = 1, minMagnitude = 0) {
		return Vector.fromTheta(rand(PI2), minMagnitude + rand(maxMagnitude - minMagnitude))
	}

	get copy() {
		return Vector.fromObj(this);
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	subtract(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	negate() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}

	multiply(scale) {
		this.x *= scale;
		this.y *= scale;
		return this;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	cross(v) {
		return this.x * v.y - this.y * v.x;
	}

	get magnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

	get magnitude() {
		return Math.sqrt(this.magnitudeSqr);
	}

	set magnitude(magnitude) {
		let prevMagnitude = this.magnitude;
		if (!prevMagnitude) {
			this.x = magnitude;
			this.y = 0;
		} else {
			let mult = magnitude / prevMagnitude;
			this.multiply(mult);
		}
		return prevMagnitude;
	}

	// rotates clockwise
	rotateByCosSin(cos, sin) {
		let tempX = this.x;
		this.x = this.x * cos - this.y * sin;
		this.y = tempX * sin + this.y * cos;
		return this;
	}

	// assumes (cos, sin) represents a rotation (0, PI).
	rotateByCosSinTowards(cos, sin, towards) {
		let clockwise = this.cross(towards) > 0;
		if (clockwise)
			this.rotateByCosSin(cos, sin);
		else
			this.rotateByCosSin(cos, -sin);

		let afterClockwise = this.cross(towards) > 0;
		if (clockwise !== afterClockwise) {
			let magnitude = this.magnitude;
			this.x = towards.x;
			this.y = towards.y;
			this.magnitude = magnitude;
		}

		return this;
	}

	static distanceFromSegmentToPoint(segmentStart, segmentEnd, point) {
		point.subtract(segmentStart);
		segmentEnd.subtract(segmentStart);
		let t = point.dot(segmentEnd) / segmentEnd.magnitudeSqr;
		t = clamp(t, 0, 1);
		segmentEnd.multiply(t);
		return point.subtract(segmentEnd).magnitude;
	}
}

module.exports = Vector;

},{"./Number":104}],108:[function(require,module,exports){
const Looper = require('../logic/Looper');
const Game = require('../logic/Game');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');

let canvas = document.querySelector('#canvas');
let logicButtonsRow = document.querySelector('#logic-buttons-row');
let looper = new Looper(canvas);

let logicCLasses = [
	Game,
	GraphicsDemo,
];

logicCLasses.forEach(LogicClass => {
	let button = document.createElement('button');
	button.textContent = LogicClass.name;
	button.addEventListener('click', () => {
		looper.setLogicClass(LogicClass);
		history.replaceState(null, '', `/${LogicClass.name}`);
	});
	logicButtonsRow.append(button);
});

let StartLogicClass = logicCLasses.find(LogicClass => `/${LogicClass.name}` === location.pathname) || logicCLasses[0];
looper.setLogicClass(StartLogicClass);

},{"../logic/Game":72,"../logic/GraphicsDemo":73,"../logic/InterfaceDemo":74,"../logic/Looper":76,"../logic/MapDemo":77,"../logic/NoiseDemo":78,"../logic/StarfieldDemo":79}]},{},[108])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc2ltcGxleC1ub2lzZS9zaW1wbGV4LW5vaXNlLmpzIiwic3JjL2FiaWxpdGllcy9BYmlsaXR5LmpzIiwic3JjL2FiaWxpdGllcy9BY2NlbGVyYXRlLmpzIiwic3JjL2FiaWxpdGllcy9Cb21iQXR0YWNrLmpzIiwic3JjL2FiaWxpdGllcy9DaGFyZ2VkUHJvamVjdGlsZUF0dGFjay5qcyIsInNyYy9hYmlsaXRpZXMvRGFzaC5qcyIsInNyYy9hYmlsaXRpZXMvRGVsYXllZFJlZ2VuLmpzIiwic3JjL2FiaWxpdGllcy9IZWFsLmpzIiwic3JjL2FiaWxpdGllcy9MYXNlckF0dGFjay5qcyIsInNyYy9hYmlsaXRpZXMvUHJvamVjdGlsZUF0dGFjay5qcyIsInNyYy9jYW1lcmEvQ2FtZXJhLmpzIiwic3JjL2NvbnRyb2wvQ29udHJvbGxlci5qcyIsInNyYy9jb250cm9sL0tleW1hcHBpbmcuanMiLCJzcmMvY29udHJvbC9TdGF0ZS5qcyIsInNyYy9lbnRpdGllcy9CdWZmLmpzIiwic3JjL2VudGl0aWVzL0VudGl0eS5qcyIsInNyYy9lbnRpdGllcy9MaXZpbmdFbnRpdHkuanMiLCJzcmMvZW50aXRpZXMvTWFwQm91bmRhcnkuanMiLCJzcmMvZW50aXRpZXMvUGxheWVyLmpzIiwic3JjL2VudGl0aWVzL1JvY2suanMiLCJzcmMvZW50aXRpZXMvUm9ja01pbmVyYWwuanMiLCJzcmMvZW50aXRpZXMvYXR0YWNrL0FyZWFEZWdlbi5qcyIsInNyYy9lbnRpdGllcy9hdHRhY2svQm9tYi5qcyIsInNyYy9lbnRpdGllcy9hdHRhY2svTGFzZXIuanMiLCJzcmMvZW50aXRpZXMvYXR0YWNrL1Byb2plY3RpbGUuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL0FpbS5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvQXJlYURlZ2VuTGF5ZXIuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL0NoYXNlLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9Db29sZG93bi5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvRGFzaC5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvRGlzdGFuY2UuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL01vZHVsZS5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvTW9kdWxlTWFuYWdlci5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvTmVhcmJ5RGVnZW4uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlL1BhdHRlcm5lZFBlcmlvZC5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvUGVyaW9kLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9Qb3NpdGlvbi5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvUm90YXRlLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9TaG90Z3VuLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZS9TdGF0aWNMYXNlci5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGUvVHJpZ2dlci5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9DaGFtcGlvbi5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9Nb25zdGVyLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL01vbnN0ZXJLbm93bGVkZ2UuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vQWltaW5nTGFzZXJUdXJyZXQuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vQm9tYkxheWVyLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0Rhc2hDaGFzZXIuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vRXhwbG9kaW5nVGljay5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9NZWNoYW5pY2FsQm9zcy5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9NZWNoYW5pY2FsQm9zc0Vhcmx5LmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL1NuaXBlclRpY2suanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vU3RhdGljNERpclR1cnJldC5qcyIsInNyYy9lbnRpdGllcy9wYXJ0aWNsZS9EYW1hZ2VEdXN0LmpzIiwic3JjL2VudGl0aWVzL3BhcnRpY2xlL0R1c3QuanMiLCJzcmMvZ3JhcGhpY3MvRGlhbW9uZFNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvRG91YmxlSG9yaXpEaWFtb25kU2hpcC5qcyIsInNyYy9ncmFwaGljcy9HcmFwaGljcy5qcyIsInNyYy9ncmFwaGljcy9IZXhhZ29uU2hpcC5qcyIsInNyYy9ncmFwaGljcy9QYXRoQ3JlYXRvci5qcyIsInNyYy9ncmFwaGljcy9SZWN0MURvdHNTaGlwLmpzIiwic3JjL2dyYXBoaWNzL1JlY3Q0RG90c1NoaXAuanMiLCJzcmMvZ3JhcGhpY3MvUmVjdEdyYXBoaWMuanMiLCJzcmMvZ3JhcGhpY3MvUm9ja0dyYXBoaWMuanMiLCJzcmMvZ3JhcGhpY3MvU3BsaXREaWFtb25kU2hpcC5qcyIsInNyYy9ncmFwaGljcy9UZXN0U2hpcC5qcyIsInNyYy9ncmFwaGljcy9WU2hpcC5qcyIsInNyYy9ncmFwaGljcy9XU2hpcC5qcyIsInNyYy9pbnRlcmZhY2UvQnV0dG9uLmpzIiwic3JjL2ludGVyZmFjZS9JbnRlcmZhY2UuanMiLCJzcmMvaW50ZXJzZWN0aW9uL0JvdW5kcy5qcyIsInNyYy9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyLmpzIiwic3JjL2xvZ2ljL0dhbWUuanMiLCJzcmMvbG9naWMvR3JhcGhpY3NEZW1vLmpzIiwic3JjL2xvZ2ljL0ludGVyZmFjZURlbW8uanMiLCJzcmMvbG9naWMvTG9naWMuanMiLCJzcmMvbG9naWMvTG9vcGVyLmpzIiwic3JjL2xvZ2ljL01hcERlbW8uanMiLCJzcmMvbG9naWMvTm9pc2VEZW1vLmpzIiwic3JjL2xvZ2ljL1N0YXJmaWVsZERlbW8uanMiLCJzcmMvbWFwL01hcC5qcyIsInNyYy9tYXAvTWFwR2VuZXJhdG9yQXJlbmEuanMiLCJzcmMvbWFwL01pbmltYXAuanMiLCJzcmMvcGFpbnRlci9CYXIuanMiLCJzcmMvcGFpbnRlci9CYXJDLmpzIiwic3JjL3BhaW50ZXIvTGluZS5qcyIsInNyYy9wYWludGVyL1BhaW50ZXIuanMiLCJzcmMvcGFpbnRlci9QYWludGVyQ29tcG9zaXRvci5qcyIsInNyYy9wYWludGVyL1BhaW50ZXJFbGVtZW50LmpzIiwic3JjL3BhaW50ZXIvUGF0aC5qcyIsInNyYy9wYWludGVyL1JlY3QuanMiLCJzcmMvcGFpbnRlci9SZWN0Qy5qcyIsInNyYy9wYWludGVyL1RleHQuanMiLCJzcmMvc3RhcmZpZWxkL1N0YXIuanMiLCJzcmMvc3RhcmZpZWxkL1N0YXJmaWVsZC5qcyIsInNyYy9zdGFyZmllbGQvU3RhcmZpZWxkTm9pc2UuanMiLCJzcmMvdXRpbC9Db2xvci5qcyIsInNyYy91dGlsL0NvbnN0YW50cy5qcyIsInNyYy91dGlsL0RlY2F5LmpzIiwic3JjL3V0aWwvRW51bS5qcyIsInNyYy91dGlsL0Zwc1RyYWNrZXIuanMiLCJzcmMvdXRpbC9JdGVtLmpzIiwic3JjL3V0aWwvTGlua2VkTGlzdC5qcyIsInNyYy91dGlsL05vaXNlLmpzIiwic3JjL3V0aWwvTnVtYmVyLmpzIiwic3JjL3V0aWwvUGhhc2UuanMiLCJzcmMvdXRpbC9Qb29sLmpzIiwic3JjL3V0aWwvVmVjdG9yLmpzIiwic3JjL3ZpZXcvQ2FudmFzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogQSBmYXN0IGphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2Ygc2ltcGxleCBub2lzZSBieSBKb25hcyBXYWduZXJcblxuQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbkJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG5cblxuIENvcHlyaWdodCAoYykgMjAxOCBKb25hcyBXYWduZXJcblxuIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuIFNPRlRXQVJFLlxuICovXG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgRjIgPSAwLjUgKiAoTWF0aC5zcXJ0KDMuMCkgLSAxLjApO1xuICB2YXIgRzIgPSAoMy4wIC0gTWF0aC5zcXJ0KDMuMCkpIC8gNi4wO1xuICB2YXIgRjMgPSAxLjAgLyAzLjA7XG4gIHZhciBHMyA9IDEuMCAvIDYuMDtcbiAgdmFyIEY0ID0gKE1hdGguc3FydCg1LjApIC0gMS4wKSAvIDQuMDtcbiAgdmFyIEc0ID0gKDUuMCAtIE1hdGguc3FydCg1LjApKSAvIDIwLjA7XG5cbiAgZnVuY3Rpb24gU2ltcGxleE5vaXNlKHJhbmRvbU9yU2VlZCkge1xuICAgIHZhciByYW5kb207XG4gICAgaWYgKHR5cGVvZiByYW5kb21PclNlZWQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmFuZG9tID0gcmFuZG9tT3JTZWVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChyYW5kb21PclNlZWQpIHtcbiAgICAgIHJhbmRvbSA9IGFsZWEocmFuZG9tT3JTZWVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZG9tID0gTWF0aC5yYW5kb207XG4gICAgfVxuICAgIHRoaXMucCA9IGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pO1xuICAgIHRoaXMucGVybSA9IG5ldyBVaW50OEFycmF5KDUxMik7XG4gICAgdGhpcy5wZXJtTW9kMTIgPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTEyOyBpKyspIHtcbiAgICAgIHRoaXMucGVybVtpXSA9IHRoaXMucFtpICYgMjU1XTtcbiAgICAgIHRoaXMucGVybU1vZDEyW2ldID0gdGhpcy5wZXJtW2ldICUgMTI7XG4gICAgfVxuXG4gIH1cbiAgU2ltcGxleE5vaXNlLnByb3RvdHlwZSA9IHtcbiAgICBncmFkMzogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMCxcbiAgICAgIC0xLCAxLCAwLFxuICAgICAgMSwgLTEsIDAsXG5cbiAgICAgIC0xLCAtMSwgMCxcbiAgICAgIDEsIDAsIDEsXG4gICAgICAtMSwgMCwgMSxcblxuICAgICAgMSwgMCwgLTEsXG4gICAgICAtMSwgMCwgLTEsXG4gICAgICAwLCAxLCAxLFxuXG4gICAgICAwLCAtMSwgMSxcbiAgICAgIDAsIDEsIC0xLFxuICAgICAgMCwgLTEsIC0xXSksXG4gICAgZ3JhZDQ6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLFxuICAgICAgMCwgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLFxuICAgICAgMSwgMCwgMSwgMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAxLCAxLCAwLCAtMSwgLTEsXG4gICAgICAtMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsXG4gICAgICAxLCAxLCAwLCAxLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIDEsIDEsIC0xLCAwLCAtMSxcbiAgICAgIC0xLCAxLCAwLCAxLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSxcbiAgICAgIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLCAwLFxuICAgICAgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLCAwXSksXG4gICAgbm9pc2UyRDogZnVuY3Rpb24oeGluLCB5aW4pIHtcbiAgICAgIHZhciBwZXJtTW9kMTIgPSB0aGlzLnBlcm1Nb2QxMjtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQzID0gdGhpcy5ncmFkMztcbiAgICAgIHZhciBuMCA9IDA7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIG4xID0gMDtcbiAgICAgIHZhciBuMiA9IDA7XG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4pICogRjI7IC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqKSAqIEcyO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgLy8gRm9yIHRoZSAyRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhbiBlcXVpbGF0ZXJhbCB0cmlhbmdsZS5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCAobWlkZGxlKSBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqKSBjb29yZHNcbiAgICAgIGlmICh4MCA+IHkwKSB7XG4gICAgICAgIGkxID0gMTtcbiAgICAgICAgajEgPSAwO1xuICAgICAgfSAvLyBsb3dlciB0cmlhbmdsZSwgWFkgb3JkZXI6ICgwLDApLT4oMSwwKS0+KDEsMSlcbiAgICAgIGVsc2Uge1xuICAgICAgICBpMSA9IDA7XG4gICAgICAgIGoxID0gMTtcbiAgICAgIH0gLy8gdXBwZXIgdHJpYW5nbGUsIFlYIG9yZGVyOiAoMCwwKS0+KDAsMSktPigxLDEpXG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG4gICAgICAvLyBjID0gKDMtc3FydCgzKSkvNlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEcyOyAvLyBPZmZzZXRzIGZvciBtaWRkbGUgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEcyO1xuICAgICAgdmFyIHgyID0geDAgLSAxLjAgKyAyLjAgKiBHMjsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIDEuMCArIDIuMCAqIEcyO1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSB0aHJlZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC41IC0geDAgKiB4MCAtIHkwICogeTA7XG4gICAgICBpZiAodDAgPj0gMCkge1xuICAgICAgICB2YXIgZ2kwID0gcGVybU1vZDEyW2lpICsgcGVybVtqal1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwKTsgLy8gKHgseSkgb2YgZ3JhZDMgdXNlZCBmb3IgMkQgZ3JhZGllbnRcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNSAtIHgxICogeDEgLSB5MSAqIHkxO1xuICAgICAgaWYgKHQxID49IDApIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC41IC0geDIgKiB4MiAtIHkyICogeTI7XG4gICAgICBpZiAodDIgPj0gMCkge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgMSArIHBlcm1bamogKyAxXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gcmV0dXJuIHZhbHVlcyBpbiB0aGUgaW50ZXJ2YWwgWy0xLDFdLlxuICAgICAgcmV0dXJuIDcwLjAgKiAobjAgKyBuMSArIG4yKTtcbiAgICB9LFxuICAgIC8vIDNEIHNpbXBsZXggbm9pc2VcbiAgICBub2lzZTNEOiBmdW5jdGlvbih4aW4sIHlpbiwgemluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAsIG4xLCBuMiwgbjM7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZm91ciBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4gKyB6aW4pICogRjM7IC8vIFZlcnkgbmljZSBhbmQgc2ltcGxlIHNrZXcgZmFjdG9yIGZvciAzRFxuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHppbiArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGogKyBrKSAqIEczO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHopIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciBaMCA9IGsgLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkseiBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgdmFyIHowID0gemluIC0gWjA7XG4gICAgICAvLyBGb3IgdGhlIDNEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGEgc2xpZ2h0bHkgaXJyZWd1bGFyIHRldHJhaGVkcm9uLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgICAgdmFyIGkxLCBqMSwgazE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgdmFyIGkyLCBqMiwgazI7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGosaykgY29vcmRzXG4gICAgICBpZiAoeDAgPj0geTApIHtcbiAgICAgICAgaWYgKHkwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDA7XG4gICAgICAgIH0gLy8gWCBZIFogb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPj0gejApIHtcbiAgICAgICAgICBpMSA9IDE7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBYIFogWSBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMTtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBaIFggWSBvcmRlclxuICAgICAgfVxuICAgICAgZWxzZSB7IC8vIHgwPHkwXG4gICAgICAgIGlmICh5MCA8IHowKSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAwO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBZIFggb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFkgWiBYIG9yZGVyXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFkgWCBaIG9yZGVyXG4gICAgICB9XG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCwwKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jLC1jKSBpbiAoeCx5LHopLFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDEsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYywtYykgaW4gKHgseSx6KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMCwxKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoLWMsLWMsMS1jKSBpbiAoeCx5LHopLCB3aGVyZVxuICAgICAgLy8gYyA9IDEvNi5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMzsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEczO1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEczO1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEczOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gajIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB6MiA9IHowIC0gazIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB4MyA9IHgwIC0gMS4wICsgMy4wICogRzM7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTMgPSB5MCAtIDEuMCArIDMuMCAqIEczO1xuICAgICAgdmFyIHozID0gejAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZm91ciBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowO1xuICAgICAgaWYgKHQwIDwgMCkgbjAgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bamogKyBwZXJtW2trXV1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwICsgZ3JhZDNbZ2kwICsgMl0gKiB6MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejE7XG4gICAgICBpZiAodDEgPCAwKSBuMSA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kxID0gcGVybU1vZDEyW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazFdXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEgKyBncmFkM1tnaTEgKyAyXSAqIHoxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSBwZXJtTW9kMTJbaWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMl1dXSAqIDM7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDNbZ2kyXSAqIHgyICsgZ3JhZDNbZ2kyICsgMV0gKiB5MiArIGdyYWQzW2dpMiArIDJdICogejIpO1xuICAgICAgfVxuICAgICAgdmFyIHQzID0gMC42IC0geDMgKiB4MyAtIHkzICogeTMgLSB6MyAqIHozO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxXV1dICogMztcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkM1tnaTNdICogeDMgKyBncmFkM1tnaTMgKyAxXSAqIHkzICsgZ3JhZDNbZ2kzICsgMl0gKiB6Myk7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byBzdGF5IGp1c3QgaW5zaWRlIFstMSwxXVxuICAgICAgcmV0dXJuIDMyLjAgKiAobjAgKyBuMSArIG4yICsgbjMpO1xuICAgIH0sXG4gICAgLy8gNEQgc2ltcGxleCBub2lzZSwgYmV0dGVyIHNpbXBsZXggcmFuayBvcmRlcmluZyBtZXRob2QgMjAxMi0wMy0wOVxuICAgIG5vaXNlNEQ6IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQ0ID0gdGhpcy5ncmFkNDtcblxuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zLCBuNDsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIC8vIFNrZXcgdGhlICh4LHkseix3KSBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggY2VsbCBvZiAyNCBzaW1wbGljZXMgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHggKyB5ICsgeiArIHcpICogRjQ7IC8vIEZhY3RvciBmb3IgNEQgc2tld2luZ1xuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHggKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5ICsgcyk7XG4gICAgICB2YXIgayA9IE1hdGguZmxvb3IoeiArIHMpO1xuICAgICAgdmFyIGwgPSBNYXRoLmZsb29yKHcgKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgayArIGwpICogRzQ7IC8vIEZhY3RvciBmb3IgNEQgdW5za2V3aW5nXG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkseix3KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciBXMCA9IGwgLSB0O1xuICAgICAgdmFyIHgwID0geCAtIFgwOyAvLyBUaGUgeCx5LHosdyBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHkgLSBZMDtcbiAgICAgIHZhciB6MCA9IHogLSBaMDtcbiAgICAgIHZhciB3MCA9IHcgLSBXMDtcbiAgICAgIC8vIEZvciB0aGUgNEQgY2FzZSwgdGhlIHNpbXBsZXggaXMgYSA0RCBzaGFwZSBJIHdvbid0IGV2ZW4gdHJ5IHRvIGRlc2NyaWJlLlxuICAgICAgLy8gVG8gZmluZCBvdXQgd2hpY2ggb2YgdGhlIDI0IHBvc3NpYmxlIHNpbXBsaWNlcyB3ZSdyZSBpbiwgd2UgbmVlZCB0b1xuICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWduaXR1ZGUgb3JkZXJpbmcgb2YgeDAsIHkwLCB6MCBhbmQgdzAuXG4gICAgICAvLyBTaXggcGFpci13aXNlIGNvbXBhcmlzb25zIGFyZSBwZXJmb3JtZWQgYmV0d2VlbiBlYWNoIHBvc3NpYmxlIHBhaXJcbiAgICAgIC8vIG9mIHRoZSBmb3VyIGNvb3JkaW5hdGVzLCBhbmQgdGhlIHJlc3VsdHMgYXJlIHVzZWQgdG8gcmFuayB0aGUgbnVtYmVycy5cbiAgICAgIHZhciByYW5reCA9IDA7XG4gICAgICB2YXIgcmFua3kgPSAwO1xuICAgICAgdmFyIHJhbmt6ID0gMDtcbiAgICAgIHZhciByYW5rdyA9IDA7XG4gICAgICBpZiAoeDAgPiB5MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3krKztcbiAgICAgIGlmICh4MCA+IHowKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5reisrO1xuICAgICAgaWYgKHgwID4gdzApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICBpZiAoeTAgPiB6MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh5MCA+IHcwKSByYW5reSsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHowID4gdzApIHJhbmt6Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICB2YXIgaTEsIGoxLCBrMSwgbDE7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBzZWNvbmQgc2ltcGxleCBjb3JuZXJcbiAgICAgIHZhciBpMiwgajIsIGsyLCBsMjsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIHRoaXJkIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTMsIGozLCBrMywgbDM7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBmb3VydGggc2ltcGxleCBjb3JuZXJcbiAgICAgIC8vIHNpbXBsZXhbY10gaXMgYSA0LXZlY3RvciB3aXRoIHRoZSBudW1iZXJzIDAsIDEsIDIgYW5kIDMgaW4gc29tZSBvcmRlci5cbiAgICAgIC8vIE1hbnkgdmFsdWVzIG9mIGMgd2lsbCBuZXZlciBvY2N1ciwgc2luY2UgZS5nLiB4Pnk+ej53IG1ha2VzIHg8eiwgeTx3IGFuZCB4PHdcbiAgICAgIC8vIGltcG9zc2libGUuIE9ubHkgdGhlIDI0IGluZGljZXMgd2hpY2ggaGF2ZSBub24temVybyBlbnRyaWVzIG1ha2UgYW55IHNlbnNlLlxuICAgICAgLy8gV2UgdXNlIGEgdGhyZXNob2xkaW5nIHRvIHNldCB0aGUgY29vcmRpbmF0ZXMgaW4gdHVybiBmcm9tIHRoZSBsYXJnZXN0IG1hZ25pdHVkZS5cbiAgICAgIC8vIFJhbmsgMyBkZW5vdGVzIHRoZSBsYXJnZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMSA9IHJhbmt4ID49IDMgPyAxIDogMDtcbiAgICAgIGoxID0gcmFua3kgPj0gMyA/IDEgOiAwO1xuICAgICAgazEgPSByYW5reiA+PSAzID8gMSA6IDA7XG4gICAgICBsMSA9IHJhbmt3ID49IDMgPyAxIDogMDtcbiAgICAgIC8vIFJhbmsgMiBkZW5vdGVzIHRoZSBzZWNvbmQgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTIgPSByYW5reCA+PSAyID8gMSA6IDA7XG4gICAgICBqMiA9IHJhbmt5ID49IDIgPyAxIDogMDtcbiAgICAgIGsyID0gcmFua3ogPj0gMiA/IDEgOiAwO1xuICAgICAgbDIgPSByYW5rdyA+PSAyID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDEgZGVub3RlcyB0aGUgc2Vjb25kIHNtYWxsZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMyA9IHJhbmt4ID49IDEgPyAxIDogMDtcbiAgICAgIGozID0gcmFua3kgPj0gMSA/IDEgOiAwO1xuICAgICAgazMgPSByYW5reiA+PSAxID8gMSA6IDA7XG4gICAgICBsMyA9IHJhbmt3ID49IDEgPyAxIDogMDtcbiAgICAgIC8vIFRoZSBmaWZ0aCBjb3JuZXIgaGFzIGFsbCBjb29yZGluYXRlIG9mZnNldHMgPSAxLCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgdGhhdC5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHNDsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzQ7XG4gICAgICB2YXIgejEgPSB6MCAtIGsxICsgRzQ7XG4gICAgICB2YXIgdzEgPSB3MCAtIGwxICsgRzQ7XG4gICAgICB2YXIgeDIgPSB4MCAtIGkyICsgMi4wICogRzQ7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzQ7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzQ7XG4gICAgICB2YXIgdzIgPSB3MCAtIGwyICsgMi4wICogRzQ7XG4gICAgICB2YXIgeDMgPSB4MCAtIGkzICsgMy4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGZvdXJ0aCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSBqMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHozID0gejAgLSBrMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHczID0gdzAgLSBsMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHg0ID0geDAgLSAxLjAgKyA0LjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHk0ID0geTAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIHZhciB6NCA9IHowIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgdzQgPSB3MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSBmaXZlIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICB2YXIga2sgPSBrICYgMjU1O1xuICAgICAgdmFyIGxsID0gbCAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZpdmUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowIC0gdzAgKiB3MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSAocGVybVtpaSArIHBlcm1bamogKyBwZXJtW2trICsgcGVybVtsbF1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQ0W2dpMF0gKiB4MCArIGdyYWQ0W2dpMCArIDFdICogeTAgKyBncmFkNFtnaTAgKyAyXSAqIHowICsgZ3JhZDRbZ2kwICsgM10gKiB3MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejEgLSB3MSAqIHcxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IChwZXJtW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazEgKyBwZXJtW2xsICsgbDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkNFtnaTFdICogeDEgKyBncmFkNFtnaTEgKyAxXSAqIHkxICsgZ3JhZDRbZ2kxICsgMl0gKiB6MSArIGdyYWQ0W2dpMSArIDNdICogdzEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC42IC0geDIgKiB4MiAtIHkyICogeTIgLSB6MiAqIHoyIC0gdzIgKiB3MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSAocGVybVtpaSArIGkyICsgcGVybVtqaiArIGoyICsgcGVybVtrayArIGsyICsgcGVybVtsbCArIGwyXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDRbZ2kyXSAqIHgyICsgZ3JhZDRbZ2kyICsgMV0gKiB5MiArIGdyYWQ0W2dpMiArIDJdICogejIgKyBncmFkNFtnaTIgKyAzXSAqIHcyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MyAtIHczICogdzM7XG4gICAgICBpZiAodDMgPCAwKSBuMyA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kzID0gKHBlcm1baWkgKyBpMyArIHBlcm1bamogKyBqMyArIHBlcm1ba2sgKyBrMyArIHBlcm1bbGwgKyBsM11dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MyAqPSB0MztcbiAgICAgICAgbjMgPSB0MyAqIHQzICogKGdyYWQ0W2dpM10gKiB4MyArIGdyYWQ0W2dpMyArIDFdICogeTMgKyBncmFkNFtnaTMgKyAyXSAqIHozICsgZ3JhZDRbZ2kzICsgM10gKiB3Myk7XG4gICAgICB9XG4gICAgICB2YXIgdDQgPSAwLjYgLSB4NCAqIHg0IC0geTQgKiB5NCAtIHo0ICogejQgLSB3NCAqIHc0O1xuICAgICAgaWYgKHQ0IDwgMCkgbjQgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpNCA9IChwZXJtW2lpICsgMSArIHBlcm1bamogKyAxICsgcGVybVtrayArIDEgKyBwZXJtW2xsICsgMV1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0NCAqPSB0NDtcbiAgICAgICAgbjQgPSB0NCAqIHQ0ICogKGdyYWQ0W2dpNF0gKiB4NCArIGdyYWQ0W2dpNCArIDFdICogeTQgKyBncmFkNFtnaTQgKyAyXSAqIHo0ICsgZ3JhZDRbZ2k0ICsgM10gKiB3NCk7XG4gICAgICB9XG4gICAgICAvLyBTdW0gdXAgYW5kIHNjYWxlIHRoZSByZXN1bHQgdG8gY292ZXIgdGhlIHJhbmdlIFstMSwxXVxuICAgICAgcmV0dXJuIDI3LjAgKiAobjAgKyBuMSArIG4yICsgbjMgKyBuNCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgcCA9IG5ldyBVaW50OEFycmF5KDI1Nik7XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICBwW2ldID0gaTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NTsgaSsrKSB7XG4gICAgICB2YXIgciA9IGkgKyB+fihyYW5kb20oKSAqICgyNTYgLSBpKSk7XG4gICAgICB2YXIgYXV4ID0gcFtpXTtcbiAgICAgIHBbaV0gPSBwW3JdO1xuICAgICAgcFtyXSA9IGF1eDtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgU2ltcGxleE5vaXNlLl9idWlsZFBlcm11dGF0aW9uVGFibGUgPSBidWlsZFBlcm11dGF0aW9uVGFibGU7XG5cbiAgZnVuY3Rpb24gYWxlYSgpIHtcbiAgICAvLyBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbiAgICB2YXIgczAgPSAwO1xuICAgIHZhciBzMSA9IDA7XG4gICAgdmFyIHMyID0gMDtcbiAgICB2YXIgYyA9IDE7XG5cbiAgICB2YXIgbWFzaCA9IG1hc2hlcigpO1xuICAgIHMwID0gbWFzaCgnICcpO1xuICAgIHMxID0gbWFzaCgnICcpO1xuICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHMwIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMCA8IDApIHtcbiAgICAgICAgczAgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMxIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMSA8IDApIHtcbiAgICAgICAgczEgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMyIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMiA8IDApIHtcbiAgICAgICAgczIgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWFzaCA9IG51bGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICAgIHMwID0gczE7XG4gICAgICBzMSA9IHMyO1xuICAgICAgcmV0dXJuIHMyID0gdCAtIChjID0gdCB8IDApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWFzaGVyKCkge1xuICAgIHZhciBuID0gMHhlZmM4MjQ5ZDtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuICs9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgICAgdmFyIGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgaCAqPSBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuICAgICAgfVxuICAgICAgcmV0dXJuIChuID4+PiAwKSAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFtZFxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBTaW1wbGV4Tm9pc2U7fSk7XG4gIC8vIGNvbW1vbiBqc1xuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gYnJvd3NlclxuICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgd2luZG93LlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gbm9kZWpzXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU2ltcGxleE5vaXNlO1xuICB9XG5cbn0pKCk7XG4iLCJjb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XHJcbmNvbnN0IEtleW1hcHBpbmcgPSByZXF1aXJlKCcuLi9jb250cm9sL0tleW1hcHBpbmcnKTtcclxuY29uc3Qge0NvbG9ycywgUG9zaXRpb25zfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcclxuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xyXG5jb25zdCBCYXIgPSByZXF1aXJlKCcuLi9wYWludGVyL0JhcicpO1xyXG5cclxuY2xhc3MgQWJpbGl0eSB7XHJcblx0Y29uc3RydWN0b3IoY29vbGRvd24sIGNoYXJnZXMsIHN0YW1pbmEsIGNoYW5uZWxTdGFtaW5hLCByZXBlYXRhYmxlLCBjaGFubmVsRHVyYXRpb24pIHtcclxuXHRcdHRoaXMuY29vbGRvd24gPSBuZXcgUG9vbChjb29sZG93biwgLTEpO1xyXG5cdFx0dGhpcy5jaGFyZ2VzID0gbmV3IFBvb2woY2hhcmdlcywgMSk7XHJcblx0XHR0aGlzLnN0YW1pbmEgPSBzdGFtaW5hO1xyXG5cdFx0dGhpcy5jaGFubmVsU3RhbWluYSA9IGNoYW5uZWxTdGFtaW5hO1xyXG5cdFx0dGhpcy5yZXBlYXRhYmxlID0gcmVwZWF0YWJsZTtcclxuXHRcdC8vIHRvZG8gW2xvd10gYWxsb3cgaW5kaWNhdGluZyB3aGV0aGVyIGNoYW5uZWwgd2lsbCBmb3JjZSBzdG9wIHVwb24gcmVhY2hpbmcgbWF4IG9yIHdpbGwgYWxsb3cgdG8gY29udGludWVcclxuXHRcdHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uID0gY2hhbm5lbER1cmF0aW9uOyAvLyAtMSBpbmRpY2F0ZXMgaW5maW5pdGVcclxuXHRcdHRoaXMuY2hhbm5lbER1cmF0aW9uID0gMDsgLy8gMCBvbiBzdGFydCwgMS4uLiBvbiBzdWJzZXF1ZW50IGNhbGxzXHJcblx0fVxyXG5cclxuXHRzZXRVaSh1aUluZGV4KSB7XHJcblx0XHR0aGlzLnVpSW5kZXggPSB1aUluZGV4O1xyXG5cdFx0dGhpcy51aUNvbG9yID0gQ29sb3JzLlBMQVlFUl9BQklMSVRJRVNbdWlJbmRleF07XHJcblx0XHR0aGlzLnVpVGV4dCA9IEtleW1hcHBpbmcuZ2V0S2V5cyhLZXltYXBwaW5nLkNvbnRyb2xzLkFCSUxJVFlfSVt1aUluZGV4XSkuam9pbignLycpO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyLCB3YW50QWN0aXZlKSB7XHJcblx0XHR0aGlzLnJlZnJlc2gocGxheWVyKTtcclxuXHRcdGlmICh3YW50QWN0aXZlICYmIHRoaXMuc2FmZUFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyKSlcclxuXHRcdFx0dGhpcy5jaGFubmVsRHVyYXRpb24rKztcclxuXHRcdGVsc2UgaWYgKHRoaXMuY2hhbm5lbER1cmF0aW9uICE9PSAwKSB7XHJcblx0XHRcdHRoaXMuZW5kQWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpO1xyXG5cdFx0XHR0aGlzLmNoYW5uZWxEdXJhdGlvbiA9IDA7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZWZyZXNoKHBsYXllcikge1xyXG5cdFx0aWYgKCF0aGlzLmNoYXJnZXMuaXNGdWxsKCkgJiYgdGhpcy5jb29sZG93bi5pbmNyZW1lbnQoKSkge1xyXG5cdFx0XHR0aGlzLmNoYXJnZXMuaW5jcmVtZW50KCk7XHJcblx0XHRcdHRoaXMuY29vbGRvd24ucmVzdG9yZSgpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMucmVhZHkgPSAhdGhpcy5jaGFyZ2VzLmlzRW1wdHkoKSAmJiBwbGF5ZXIuc3VmZmljaWVudFN0YW1pbmEodGhpcy5zdGFtaW5hKSAmJiAodGhpcy5yZXBlYXRhYmxlIHx8ICF0aGlzLnJlcGVhdGluZyk7XHJcblx0XHR0aGlzLnJlYWR5Q2hhbm5lbENvbnRpbnVlID0gdGhpcy5tYXhDaGFubmVsRHVyYXRpb24gJiYgdGhpcy5jaGFubmVsRHVyYXRpb24gJiYgcGxheWVyLnN1ZmZpY2llbnRTdGFtaW5hKHRoaXMuY2hhbm5lbFN0YW1pbmEpO1xyXG5cdFx0dGhpcy5yZXBlYXRpbmcgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdHNhZmVBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xyXG5cdFx0dGhpcy5yZXBlYXRpbmcgPSB0cnVlO1xyXG5cdFx0aWYgKCF0aGlzLnJlYWR5ICYmICF0aGlzLnJlYWR5Q2hhbm5lbENvbnRpbnVlKVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRpZiAoIXRoaXMuYWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpKVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0aWYgKHRoaXMucmVhZHkpIHtcclxuXHRcdFx0dGhpcy5jaGFyZ2VzLmNoYW5nZSgtMSk7XHJcblx0XHRcdHBsYXllci5jb25zdW1lU3RhbWluYSh0aGlzLnN0YW1pbmEpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cGxheWVyLmNvbnN1bWVTdGFtaW5hKHRoaXMuY2hhbm5lbFN0YW1pbmEpO1xyXG5cdFx0XHR0aGlzLmNvb2xkb3duLnZhbHVlID0gdGhpcy5jb29sZG93bi5tYXg7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdGFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyKSB7XHJcblx0XHQvKiBvdmVycmlkZSAqL1xyXG5cdH1cclxuXHJcblx0ZW5kQWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcclxuXHRcdC8qIG92ZXJyaWRlICovXHJcblx0fVxyXG5cclxuXHRnZXQgY2hhbm5lbFJhdGlvKCkge1xyXG5cdFx0aWYgKHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uID4gMCAmJiB0aGlzLmNoYW5uZWxEdXJhdGlvbiA+IDApXHJcblx0XHRcdHJldHVybiBNYXRoLm1pbih0aGlzLmNoYW5uZWxEdXJhdGlvbiAvIHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uLCAxKTtcclxuXHR9XHJcblxyXG5cdHBhaW50VWkocGFpbnRlciwgY2FtZXJhKSB7XHJcblx0XHQvLyBiYWNrZ3JvdW5kXHJcblx0XHRjb25zdCBTSVpFX1dJVEhfTUFSR0lOID0gUG9zaXRpb25zLkFCSUxJVFlfU0laRSArIFBvc2l0aW9ucy5NQVJHSU47XHJcblx0XHRjb25zdCBMRUZUID0gUG9zaXRpb25zLk1BUkdJTiArIHRoaXMudWlJbmRleCAqIFNJWkVfV0lUSF9NQVJHSU4sIFRPUCA9IDEgLSBTSVpFX1dJVEhfTUFSR0lOO1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QoTEVGVCwgVE9QLCBQb3NpdGlvbnMuQUJJTElUWV9TSVpFLCBQb3NpdGlvbnMuQUJJTElUWV9TSVpFLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IHRoaXMudWlDb2xvci5nZXRTaGFkZSgpfSkpO1xyXG5cclxuXHRcdC8vIGZvcmVncm91bmQgZm9yIGN1cnJlbnQgY2hhcmdlc1xyXG5cdFx0Y29uc3QgUk9XX0hFSUdIVCA9IFBvc2l0aW9ucy5BQklMSVRZX1NJWkUgLyB0aGlzLmNoYXJnZXMuZ2V0TWF4KCk7XHJcblx0XHRjb25zdCBIRUlHSFQgPSB0aGlzLmNoYXJnZXMuZ2V0KCkgKiBST1dfSEVJR0hUO1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QoTEVGVCwgVE9QICsgUG9zaXRpb25zLkFCSUxJVFlfU0laRSAtIEhFSUdIVCwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwgSEVJR0hULCB7ZmlsbDogdHJ1ZSwgY29sb3I6IHRoaXMudWlDb2xvci5nZXQoKX0pKTtcclxuXHJcblx0XHQvLyBoeWJyaWQgZm9yIGN1cnJlbnQgY29vbGRvd25cclxuXHRcdGlmICghdGhpcy5jb29sZG93bi5pc0Z1bGwoKSkge1xyXG5cdFx0XHRsZXQgc2hhZGUgPSB0aGlzLmNvb2xkb3duLmdldFJhdGlvKCk7XHJcblx0XHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCArIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUgLSBIRUlHSFQgLSBST1dfSEVJR0hULCBQb3NpdGlvbnMuQUJJTElUWV9TSVpFLCBST1dfSEVJR0hULCB7ZmlsbDogdHJ1ZSwgY29sb3I6IHRoaXMudWlDb2xvci5nZXRTaGFkZShzaGFkZSl9KSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gYm9yZGVyXHJcblx0XHRpZiAoIXRoaXMucmVhZHkpXHJcblx0XHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwge2NvbG9yOiBDb2xvcnMuUExBWUVSX0FCSUxJVFlfTk9UX1JFQURZLmdldCgpLCB0aGlja25lc3M6IDJ9KSk7XHJcblxyXG5cdFx0Ly8gbGV0dGVyXHJcblx0XHRwYWludGVyLmFkZChuZXcgVGV4dChMRUZUICsgUG9zaXRpb25zLkFCSUxJVFlfU0laRSAvIDIsIFRPUCArIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUgLyAyLCB0aGlzLnVpVGV4dCkpO1xyXG5cclxuXHRcdC8vIGNoYW5uZWwgYmFyXHJcblx0XHRsZXQgY2hhbm5lbFJhdGlvID0gdGhpcy5jaGFubmVsUmF0aW87XHJcblx0XHRpZiAoY2hhbm5lbFJhdGlvKVxyXG5cdFx0XHRwYWludGVyLmFkZChuZXcgQmFyKExFRlQsIFRPUCAtIFBvc2l0aW9ucy5BQklMSVRZX0NIQU5ORUxfQkFSX1NJWkUgLSBQb3NpdGlvbnMuTUFSR0lOIC8gMixcclxuXHRcdFx0XHRQb3NpdGlvbnMuQUJJTElUWV9TSVpFLCBQb3NpdGlvbnMuQUJJTElUWV9DSEFOTkVMX0JBUl9TSVpFLCBjaGFubmVsUmF0aW8sXHJcblx0XHRcdFx0dGhpcy51aUNvbG9yLmdldFNoYWRlKENvbG9ycy5CQVJfU0hBRElORyksIHRoaXMudWlDb2xvci5nZXQoKSwgdGhpcy51aUNvbG9yLmdldCgpKSlcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWJpbGl0eTtcclxuIiwiY29uc3QgQWJpbGl0eSA9IHJlcXVpcmUoJy4vQWJpbGl0eScpO1xuXG5jbGFzcyBBY2NlbGVyYXRlIGV4dGVuZHMgQWJpbGl0eSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKDIwMCwgMSwgMCwgMCwgdHJ1ZSwgLTEpO1xuXHR9XG5cblx0YWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAoIXRoaXMuY2hhbm5lbER1cmF0aW9uKSB7XG5cdFx0XHR0aGlzLmJ1ZmYgPSB0aGlzLmJ1ZmYgfHwgcGxheWVyLmFkZEJ1ZmYoKTtcblx0XHRcdHRoaXMuYnVmZi5tb3ZlU3BlZWQgPSAzO2pcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRlbmRBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdHRoaXMuYnVmZi5tb3ZlU3BlZWQgPSAwO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQWNjZWxlcmF0ZTtcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBCb21iID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL0JvbWInKTtcclxuXHJcbmNsYXNzIEJvbWJBdHRhY2sgZXh0ZW5kcyBBYmlsaXR5IHtcclxuXHRjb25zdHJ1Y3RvcihwYWludFVpQ29sdW1uKSB7XHJcblx0XHRzdXBlcigyMDAsIDIsIDIwLCAwLCBmYWxzZSwgMCk7XHJcblx0fVxyXG5cclxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xyXG5cdFx0Y29uc3QgU0laRSA9IC4wNSwgUkFOR0UgPSAuNSwgVElNRSA9IDEwMCwgREFNQUdFID0gMTAsIE1BWF9UQVJHRVRTID0gNTtcclxuXHRcdGxldCBib21iID0gbmV3IEJvbWIob3JpZ2luLngsIG9yaWdpbi55LCBTSVpFLCBTSVpFLCBSQU5HRSwgVElNRSwgREFNQUdFLCBNQVhfVEFSR0VUUywgdHJ1ZSk7XHJcblx0XHRtYXAuYWRkUHJvamVjdGlsZShib21iKTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb21iQXR0YWNrO1xyXG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL1Byb2plY3RpbGUnKTtcblxuY2xhc3MgQ2hhcmdlZFByb2plY3RpbGVBdHRhY2sgZXh0ZW5kcyBBYmlsaXR5IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0c3VwZXIoMzAsIDEsIDYsIC4xLCBmYWxzZSwgNjApO1xuXHR9XG5cblx0YWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRpZiAodGhpcy5jaGFubmVsRHVyYXRpb24gPT09IDApIHtcblx0XHRcdHRoaXMuY2hhcmdlQnVmZiA9IHRoaXMuY2hhcmdlQnVmZiB8fCBwbGF5ZXIuYWRkQnVmZigpO1xuXHRcdFx0dGhpcy5jaGFyZ2VCdWZmLm1vdmVTcGVlZCA9IC0uNTtcblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRlbmRBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGNvbnN0IFZFTE9DSVRZID0gLjAxLCBTUFJFQUQgPSAuMSwgU0laRSA9IC4wMiwgVElNRSA9IDUwLCBEQU1BR0UgPSAuMTtcblx0XHRsZXQgZGFtYWdlID0gKDEgKyB0aGlzLmNoYW5uZWxSYXRpbyAqIDMpICogREFNQUdFO1xuXG5cdFx0bGV0IGRpcmVjdHYgPSBzZXRNYWduaXR1ZGUoZGlyZWN0LngsIGRpcmVjdC55LCBWRUxPQ0lUWSk7XG5cdFx0bGV0IHJhbmR2ID0gcmFuZFZlY3RvcihWRUxPQ0lUWSAqIFNQUkVBRCk7XG5cdFx0bGV0IHByb2plY3RpbGUgPSBuZXcgUHJvamVjdGlsZShcblx0XHRcdG9yaWdpbi54LCBvcmlnaW4ueSwgU0laRSwgU0laRSxcblx0XHRcdGRpcmVjdHYueCArIHJhbmR2WzBdLCBkaXJlY3R2LnkgKyByYW5kdlsxXSxcblx0XHRcdFRJTUUsIGRhbWFnZSwgdHJ1ZSk7XG5cdFx0bWFwLmFkZFByb2plY3RpbGUocHJvamVjdGlsZSk7XG5cdFx0dGhpcy5jaGFyZ2VCdWZmLm1vdmVTcGVlZCA9IDA7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDaGFyZ2VkUHJvamVjdGlsZUF0dGFjaztcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcclxuY29uc3Qge2Jvb2xlYW5BcnJheX0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5cclxuY2xhc3MgRGFzaCBleHRlbmRzIEFiaWxpdHkge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoMTIwLCAzLCAxNSwgLjEsIGZhbHNlLCAtMSk7XHJcblx0fVxyXG5cclxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xyXG5cdFx0aWYgKCFib29sZWFuQXJyYXkocGxheWVyLmN1cnJlbnRNb3ZlKSlcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdGlmICghdGhpcy5jaGFubmVsRHVyYXRpb24pICAge1xyXG5cdFx0XHR0aGlzLmJ1ZmYgPSB0aGlzLmJ1ZmYgfHwgcGxheWVyLmFkZEJ1ZmYoKTtcclxuXHRcdFx0dGhpcy5idWZmLm1vdmVTcGVlZCA9IDE7XHJcblx0XHRcdHBsYXllci5zYWZlTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIC4uLnBsYXllci5jdXJyZW50TW92ZSwgLjEsIHRydWUpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cclxuXHRlbmRBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xyXG5cdFx0dGhpcy5idWZmLm1vdmVTcGVlZCA9IDA7XHJcblx0fVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEYXNoO1xyXG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XG5cbmNsYXNzIERlbGF5ZWRSZWdlbiBleHRlbmRzIEFiaWxpdHkge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcigwLCAxLCAwLCAwLCB0cnVlLCAwKTtcblx0XHR0aGlzLmRlbGF5ID0gbmV3IFBvb2woNjAsIC0xKTtcblx0fVxuXG5cdGFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgcGxheWVyKSB7XG5cdFx0aWYgKHBsYXllci5yZWNlbnREYW1hZ2UuZ2V0KCkpXG5cdFx0XHR0aGlzLmRlbGF5LnJlc3RvcmUoKTtcblx0XHRpZiAoIXRoaXMuZGVsYXkuaW5jcmVtZW50KCkgfHwgcGxheWVyLmhlYWx0aC5pc0Z1bGwoKSlcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRwbGF5ZXIuY2hhbmdlSGVhbHRoKC4wMDAzKTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlbGF5ZWRSZWdlbjtcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcbmNvbnN0IHtzZXRNYWduaXR1ZGV9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcblxuY2xhc3MgSGVhbCBleHRlbmRzIEFiaWxpdHkge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcig3MjAsIDEsIDMwLCAwLCBmYWxzZSwgMCk7XG5cdH1cblxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGlmIChwbGF5ZXIuaGVhbHRoLmlzRnVsbCgpKVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdHBsYXllci5jaGFuZ2VIZWFsdGgoLjEpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGVhbDtcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcbmNvbnN0IHtzZXRNYWduaXR1ZGUsIHJhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IExhc2VyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL0xhc2VyJyk7XG5cbmNsYXNzIExhc2VyQXR0YWNrIGV4dGVuZHMgQWJpbGl0eSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHN1cGVyKDMsIDE1LCAuNiwgMCwgdHJ1ZSwgMCk7XG5cdH1cblxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHBsYXllcikge1xuXHRcdGNvbnN0IFJBTkdFID0gLjE1LCBTUFJFQUQgPSAuMDUsIFRJTUUgPSAxMCwgREFNQUdFID0gLjAwMTtcblx0XHRsZXQgZGlyZWN0diA9IHNldE1hZ25pdHVkZShkaXJlY3QueCwgZGlyZWN0LnksIFJBTkdFKTtcblx0XHRsZXQgcmFuZHYgPSByYW5kVmVjdG9yKFJBTkdFICogU1BSRUFEKTtcblx0XHRsZXQgbGFzZXIgPSBuZXcgTGFzZXIob3JpZ2luLngsIG9yaWdpbi55LCBkaXJlY3R2LnggKyByYW5kdlswXSwgZGlyZWN0di55ICsgcmFuZHZbMV0sIFRJTUUsIERBTUFHRSwgdHJ1ZSk7XG5cdFx0bWFwLmFkZFByb2plY3RpbGUobGFzZXIpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGFzZXJBdHRhY2s7XG4iLCJjb25zdCBBYmlsaXR5ID0gcmVxdWlyZSgnLi9BYmlsaXR5Jyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL1Byb2plY3RpbGUnKTtcblxuY2xhc3MgUHJvamVjdGlsZUF0dGFjayBleHRlbmRzIEFiaWxpdHkge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRzdXBlcig2LCAxNSwgLjYsIDAsIHRydWUsIDApO1xuXHR9XG5cblx0YWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBwbGF5ZXIpIHtcblx0XHRjb25zdCBWRUxPQ0lUWSA9IC4wMTQsIFNQUkVBRCA9IC4wOCwgU0laRSA9IC4wMiwgVElNRSA9IDMwLCBEQU1BR0UgPSAuMTtcblx0XHRsZXQgZGlyZWN0diA9IHNldE1hZ25pdHVkZShkaXJlY3QueCwgZGlyZWN0LnksIFZFTE9DSVRZKTtcblx0XHRsZXQgcmFuZHYgPSByYW5kVmVjdG9yKFZFTE9DSVRZICogU1BSRUFEKTtcblx0XHRsZXQgcHJvamVjdGlsZSA9IG5ldyBQcm9qZWN0aWxlKG9yaWdpbi54LCBvcmlnaW4ueSwgU0laRSwgU0laRSwgZGlyZWN0di54ICsgcmFuZHZbMF0sIGRpcmVjdHYueSArIHJhbmR2WzFdLCBUSU1FLCBEQU1BR0UsIHRydWUpO1xuXHRcdG1hcC5hZGRQcm9qZWN0aWxlKHByb2plY3RpbGUpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvamVjdGlsZUF0dGFjaztcbiIsImNvbnN0IHtjbGFtcCwgYXZnfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNsYXNzIENhbWVyYSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHogPSAyKSB7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMuZW5kWiA9IHRoaXMueiA9IHo7XG5cdFx0dGhpcy5zMCA9IHRoaXMuY2FsY1MoMCk7XG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlRm9yUmVnaW9uKGZyb21TY2FsZSwgdG9MZWZ0LCB0b1RvcCwgdG9TY2FsZSkge1xuXHRcdGxldCBpbnZTY2FsZSA9IGZyb21TY2FsZSAvIHRvU2NhbGU7XG5cdFx0cmV0dXJuIG5ldyBDYW1lcmEoKC41IC0gdG9MZWZ0KSAqIGludlNjYWxlLCAoLjUgLSB0b1RvcCkgKiBpbnZTY2FsZSwgaW52U2NhbGUpO1xuXHR9XG5cblx0Ly8gY2VudGVyIHJhbmdlIFtbMCwgd2lkdGhdLCBbMCwgaGVpZ2h0XV1cblx0Ly8gYWRqdXN0bWVudCByYW5nZSBbWzAsIDFdLCBbMCwgMV1dXG5cdG1vdmUoY2VudGVyLCBhZGp1c3RtZW50KSB7XG5cdFx0Y29uc3QgQURKVVNUTUVOVF9XRUlHSFQgPSAuNSwgRklMVEVSX1dFSUdIVCA9IC45Mztcblx0XHRsZXQgeCA9IGNlbnRlci54ICsgKGFkanVzdG1lbnQueCAtIC41KSAqIEFESlVTVE1FTlRfV0VJR0hUO1xuXHRcdGxldCB5ID0gY2VudGVyLnkgKyAoYWRqdXN0bWVudC55IC0gLjUpICogQURKVVNUTUVOVF9XRUlHSFQ7XG5cdFx0dGhpcy54ID0gYXZnKHRoaXMueCwgeCwgRklMVEVSX1dFSUdIVCk7XG5cdFx0dGhpcy55ID0gYXZnKHRoaXMueSwgeSwgRklMVEVSX1dFSUdIVCk7XG5cdH1cblxuXHR6b29tKHpvb21PdXQsIHpvb21Jbikge1xuXHRcdGNvbnN0IFpPT01fUkFURSA9IC4yLCBNSU5fWiA9IDEsIE1BWF9aID0gMTAsIEZJTFRFUl9XRUlHSFQgPSAuOTM7XG5cdFx0bGV0IGR6ID0gem9vbU91dCAtIHpvb21Jbjtcblx0XHRpZiAoZHopXG5cdFx0XHR0aGlzLmVuZFogPSBjbGFtcCh0aGlzLmVuZFogKyBkeiAqIFpPT01fUkFURSwgTUlOX1osIE1BWF9aKTtcblx0XHR0aGlzLnogPSBhdmcodGhpcy56LCB0aGlzLmVuZFosIEZJTFRFUl9XRUlHSFQpO1xuXHRcdHRoaXMuczAgPSB0aGlzLmNhbGNTKDApO1xuXHR9XG5cblx0Y2FsY1MoZHopIHtcblx0XHRyZXR1cm4gMSAvICh0aGlzLnogKyBkeik7XG5cdH1cblxuXHRnZXRTKGR6KSB7XG5cdFx0cmV0dXJuIGR6ID8gdGhpcy5jYWxjUyhkeikgOiB0aGlzLnMwO1xuXHR9XG5cblx0eHQoeCwgZHogPSAwKSB7XG5cdFx0cmV0dXJuICh4IC0gdGhpcy54KSAqIHRoaXMuZ2V0UyhkeikgKyAuNTtcblx0fVxuXG5cdHl0KHksIGR6ID0gMCkge1xuXHRcdHJldHVybiAoeSAtIHRoaXMueSkgKiB0aGlzLmdldFMoZHopICsgLjU7XG5cdH1cblxuXHRzdChzaXplLCBkeiA9IDApIHtcblx0XHRyZXR1cm4gc2l6ZSAqIHRoaXMuZ2V0Uyhkeik7XG5cdH1cblxuXHR4aXQoeCkge1xuXHRcdHJldHVybiB0aGlzLnggKyAoeCAtIC41KSAqIHRoaXMuejtcblx0fVxuXG5cdHlpdCh5KSB7XG5cdFx0cmV0dXJuIHRoaXMueSArICh5IC0gLjUpICogdGhpcy56O1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiY29uc3QgU3RhdGUgPSByZXF1aXJlKCcuL1N0YXRlJyk7XG5cbmNsYXNzIENvbnRyb2xsZXIge1xuXHRjb25zdHJ1Y3Rvcihtb3VzZVRhcmdldCkge1xuXHRcdHRoaXMubW91c2VUYXJnZXRXaWR0aCA9IG1vdXNlVGFyZ2V0LndpZHRoO1xuXHRcdHRoaXMubW91c2VUYXJnZXRIZWlnaHQgPSBtb3VzZVRhcmdldC5oZWlnaHQ7XG5cblx0XHR0aGlzLmtleXMgPSB7fTtcblx0XHR0aGlzLm1vdXNlID0ge3g6IG51bGwsIHk6IG51bGx9O1xuXHRcdHRoaXMudHJhbnNmb3JtZWRNb3VzZSA9IHt9O1xuXHRcdHRoaXMubW91c2VTdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGV2ZW50ID0+XG5cdFx0XHQhZXZlbnQucmVwZWF0ICYmIHRoaXMuaGFuZGxlS2V5UHJlc3MoZXZlbnQua2V5LnRvTG93ZXJDYXNlKCkpKTtcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZXZlbnQgPT5cblx0XHRcdHRoaXMuaGFuZGxlS2V5UmVsZWFzZShldmVudC5rZXkudG9Mb3dlckNhc2UoKSkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZXZlbnQgPT5cblx0XHRcdHRoaXMuaGFuZGxlTW91c2VNb3ZlKGV2ZW50LnggLSBtb3VzZVRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC55IC0gbW91c2VUYXJnZXQub2Zmc2V0VG9wKSk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PlxuXHRcdFx0dGhpcy5oYW5kbGVNb3VzZVByZXNzKCkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+XG5cdFx0XHR0aGlzLmhhbmRsZU1vdXNlUmVsZWFzZSgpKTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT5cblx0XHRcdHRoaXMuaGFuZGxlQmx1cigpKTtcblx0fVxuXG5cdGhhbmRsZUtleVByZXNzKGtleSkge1xuXHRcdGlmICghdGhpcy5rZXlzW2tleV0pXG5cdFx0XHR0aGlzLmtleXNba2V5XSA9IG5ldyBTdGF0ZSgpO1xuXHRcdHRoaXMua2V5c1trZXldLnByZXNzKCk7XG5cdH1cblxuXHRoYW5kbGVLZXlSZWxlYXNlKGtleSkge1xuXHRcdGlmICghdGhpcy5rZXlzW2tleV0pXG5cdFx0XHR0aGlzLmtleXNba2V5XSA9IG5ldyBTdGF0ZSgpO1xuXHRcdHRoaXMua2V5c1trZXldLnJlbGVhc2UoKTtcblx0fVxuXG5cdGhhbmRsZU1vdXNlTW92ZSh4LCB5KSB7XG5cdFx0dGhpcy5tb3VzZS54ID0geCAvIHRoaXMubW91c2VUYXJnZXRXaWR0aDtcblx0XHR0aGlzLm1vdXNlLnkgPSB5IC8gdGhpcy5tb3VzZVRhcmdldEhlaWdodDtcblx0fVxuXG5cdGhhbmRsZU1vdXNlUHJlc3MoKSB7XG5cdFx0dGhpcy5tb3VzZVN0YXRlLnByZXNzKCk7XG5cdH1cblxuXHRoYW5kbGVNb3VzZVJlbGVhc2UoKSB7XG5cdFx0dGhpcy5tb3VzZVN0YXRlLnJlbGVhc2UoKTtcblx0fVxuXG5cdGhhbmRsZUJsdXIoKSB7XG5cdFx0T2JqZWN0LnZhbHVlcyh0aGlzLmtleXMpXG5cdFx0XHQuZmlsdGVyKChzdGF0ZSkgPT4gc3RhdGUuYWN0aXZlKVxuXHRcdFx0LmZvckVhY2goKHN0YXRlKSA9PiBzdGF0ZS5yZWxlYXNlKCkpO1xuXHR9XG5cblx0Ly8gbWFwIGtleSAoZS5nLiAneicpIHRvIHN0YXRlXG5cdGdldEtleVN0YXRlKGtleSkge1xuXHRcdHJldHVybiB0aGlzLmtleXNba2V5XSB8fCAodGhpcy5rZXlzW2tleV0gPSBuZXcgU3RhdGUoKSk7XG5cdH1cblxuXHRnZXRSYXdNb3VzZShkZWZhdWx0WCA9IDAsIGRlZmF1bHRZID0gMCkge1xuXHRcdHJldHVybiB0aGlzLm1vdXNlLnggPyB0aGlzLm1vdXNlIDoge3g6IGRlZmF1bHRYLCB5OiBkZWZhdWx0WX07XG5cdH1cblxuXHRpbnZlcnNlVHJhbnNmb3JtTW91c2UoaW52ZXJzZVRyYW5zZm9ybWVyKSB7XG5cdFx0dGhpcy50cmFuc2Zvcm1lZE1vdXNlLnggPSBpbnZlcnNlVHJhbnNmb3JtZXIueGl0KHRoaXMubW91c2UueCk7XG5cdFx0dGhpcy50cmFuc2Zvcm1lZE1vdXNlLnkgPSBpbnZlcnNlVHJhbnNmb3JtZXIueWl0KHRoaXMubW91c2UueSk7XG5cdH1cblxuXHRnZXRNb3VzZSgpIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc2Zvcm1lZE1vdXNlO1xuXHR9XG5cblx0Z2V0TW91c2VTdGF0ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5tb3VzZVN0YXRlO1xuXHR9XG5cblx0ZXhwaXJlKCkge1xuXHRcdE9iamVjdC52YWx1ZXModGhpcy5rZXlzKS5mb3JFYWNoKChzdGF0ZSkgPT4gc3RhdGUuZXhwaXJlKCkpO1xuXHRcdHRoaXMubW91c2VTdGF0ZS5leHBpcmUoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xuY29uc3QgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlcicpO1xuY29uc3QgU3RhdGUgPSByZXF1aXJlKCcuL1N0YXRlJyk7XG5cbmNvbnN0IENvbnRyb2xzID0gbWFrZUVudW0oXG5cdCdNT1ZFX0xFRlQnLFxuXHQnTU9WRV9VUCcsXG5cdCdNT1ZFX1JJR0hUJyxcblx0J01PVkVfRE9XTicsXG5cdCdBQklMSVRZXzEnLFxuXHQnQUJJTElUWV8yJyxcblx0J0FCSUxJVFlfMycsXG5cdCdBQklMSVRZXzQnLFxuXHQnQUJJTElUWV81Jyxcblx0J0FCSUxJVFlfNicsXG5cdCdBQklMSVRZXzcnLFxuXHQnVEFSR0VUX0xPQ0snLFxuXHQnWk9PTV9JTicsXG5cdCdaT09NX09VVCcsXG5cdCdNSU5JTUFQX1pPT00nKTtcblxuQ29udHJvbHMuQUJJTElUWV9JID0gW1xuXHRDb250cm9scy5BQklMSVRZXzEsXG5cdENvbnRyb2xzLkFCSUxJVFlfMixcblx0Q29udHJvbHMuQUJJTElUWV8zLFxuXHRDb250cm9scy5BQklMSVRZXzQsXG5cdENvbnRyb2xzLkFCSUxJVFlfNSxcblx0Q29udHJvbHMuQUJJTElUWV82LFxuXHRDb250cm9scy5BQklMSVRZXzddO1xuXG5sZXQgQ29udHJvbFRvS2V5TWFwID0ge1xuXHRbQ29udHJvbHMuTU9WRV9MRUZUXTogWydhJ10sXG5cdFtDb250cm9scy5NT1ZFX1VQXTogWyd3J10sXG5cdFtDb250cm9scy5NT1ZFX1JJR0hUXTogWydkJ10sXG5cdFtDb250cm9scy5NT1ZFX0RPV05dOiBbJ3MnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfMV06IFsnaicsICcxJ10sXG5cdFtDb250cm9scy5BQklMSVRZXzJdOiBbJ2snLCAnMiddLFxuXHRbQ29udHJvbHMuQUJJTElUWV8zXTogWydsJywgJzMnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfNF06IFsndScsICc0J10sXG5cdFtDb250cm9scy5BQklMSVRZXzVdOiBbJ2knLCAnNSddLFxuXHRbQ29udHJvbHMuQUJJTElUWV82XTogWydvJywgJzYnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfN106IFsncCcsICc3J10sXG5cdFtDb250cm9scy5UQVJHRVRfTE9DS106IFsnY2Fwc2xvY2snXSxcblx0W0NvbnRyb2xzLlpPT01fSU5dOiBbJ3gnXSxcblx0W0NvbnRyb2xzLlpPT01fT1VUXTogWyd6J10sXG5cdFtDb250cm9scy5NSU5JTUFQX1pPT01dOiBbJ3EnXSxcbn07XG5cbmNsYXNzIEtleW1hcHBpbmcge1xuXHQvLyBtYXAgY29udHJvbCAoZS5nLiBaT09NX09VVCkgdG8ga2V5cyAoZS5nLiBbJ3onLCAneSddKVxuXHRzdGF0aWMgZ2V0S2V5cyhjb250cm9sKSB7XG5cdFx0cmV0dXJuIEtleW1hcHBpbmcuQ29udHJvbFRvS2V5TWFwW2NvbnRyb2xdO1xuXHR9XG5cblx0Ly8gbWFwIGNvbnRyb2wgKGUuZy4gWk9PTV9PVVQpIHRvIHN0YXRlXG5cdHN0YXRpYyBnZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgY29udHJvbCkge1xuXHRcdHJldHVybiBTdGF0ZS5tZXJnZShLZXltYXBwaW5nLmdldEtleXMoY29udHJvbCkubWFwKGtleSA9PiBjb250cm9sbGVyLmdldEtleVN0YXRlKGtleSkpKTtcblx0fVxufVxuXG5LZXltYXBwaW5nLkNvbnRyb2xzID0gQ29udHJvbHM7XG5LZXltYXBwaW5nLkNvbnRyb2xUb0tleU1hcCA9IENvbnRyb2xUb0tleU1hcDtcblxubW9kdWxlLmV4cG9ydHMgPSBLZXltYXBwaW5nO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcblxuLy8gbGFyZ2VyIHZhbHVlcyBoYXZlIHByaW9yaXR5IHdoZW4gbXVsdGlwbGUga2V5cyBhcmUgbWFwcGVkIHRvIHRoZSBzYW1lIGNvbnRyb2xcbmNvbnN0IFN0YXRlcyA9IG1ha2VFbnVtKCdVUCcsICdSRUxFQVNFRCcsICdQUkVTU0VEJywgJ0RPV04nKTtcblxuY2xhc3MgU3RhdGUge1xuXHRjb25zdHJ1Y3RvcihzdGF0ZSA9IFN0YXRlcy5VUCkge1xuXHRcdHRoaXMuc3RhdGUgPSBzdGF0ZTtcblx0fVxuXG5cdHN0YXRpYyBtZXJnZShzdGF0ZXMpIHtcblx0XHRyZXR1cm4gbmV3IFN0YXRlKE1hdGgubWF4KC4uLnN0YXRlcy5tYXAoc3RhdGUgPT4gc3RhdGUuc3RhdGUpKSk7XG5cdH1cblxuXHRwcmVzcygpIHtcblx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLlBSRVNTRUQ7XG5cdH1cblxuXHRyZWxlYXNlKCkge1xuXHRcdHRoaXMuc3RhdGUgPSBTdGF0ZXMuUkVMRUFTRUQ7XG5cdH1cblxuXHRleHBpcmUoKSB7XG5cdFx0aWYgKHRoaXMuc3RhdGUgPT09IFN0YXRlcy5SRUxFQVNFRClcblx0XHRcdHRoaXMuc3RhdGUgPSBTdGF0ZXMuVVA7XG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gU3RhdGVzLlBSRVNTRUQpXG5cdFx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLkRPV047XG5cdH1cblxuXHRnZXQgYWN0aXZlKCkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRlID09PSBTdGF0ZXMuUFJFU1NFRCB8fCB0aGlzLnN0YXRlID09PSBTdGF0ZXMuRE9XTjtcblx0fVxuXG5cdGdldCBwcmVzc2VkKCkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRlID09PSBTdGF0ZXMuUFJFU1NFRDtcblx0fVxufVxuXG5TdGF0ZS5TdGF0ZXMgPSBTdGF0ZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGU7XG4iLCJjbGFzcyBCdWZmIHtcclxuXHRzdGF0aWMgZ2V0XyhidWZmcywga2V5KSB7XHJcblx0XHRyZXR1cm4gYnVmZnMucmVkdWNlKChhY2MsIHtba2V5XTogdmFsdWUgPSAwfSkgPT4gYWNjICsgdmFsdWUsIDEpO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIG1vdmVTcGVlZChidWZmcykge1xyXG5cdFx0cmV0dXJuIEJ1ZmYuZ2V0XyhidWZmcywgJ21vdmVTcGVlZF8nKTtcclxuXHR9XHJcblxyXG5cdHNldCBtb3ZlU3BlZWQodmFsdWUpIHtcclxuXHRcdHRoaXMubW92ZVNwZWVkXyA9IHZhbHVlO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdWZmO1xyXG4iLCJjb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vQm91bmRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNsYXNzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKSB7XG5cdFx0dGhpcy5ib3VuZHMgPSBuZXcgQm91bmRzKCk7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblx0XHR0aGlzLnNldFBvc2l0aW9uKHgsIHkpO1xuXHRcdHRoaXMubW92ZURpcmVjdGlvbiA9IHt4OiAwLCB5OiAxfTtcblx0XHR0aGlzLnF1ZXVlZFRyYWNrZWRJbnRlcnNlY3Rpb25zID0gW107XG5cdH1cblxuXHRzZXRHcmFwaGljcyhncmFwaGljcykge1xuXHRcdHRoaXMuZ3JhcGhpY3MgPSBncmFwaGljcztcblx0fVxuXG5cdHNldFBvc2l0aW9uKHgsIHkpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy5zZXRCb3VuZHMoKTtcblx0fVxuXG5cdGNoZWNrUG9zaXRpb24oaW50ZXJzZWN0aW9uRmluZGVyKSB7XG5cdFx0cmV0dXJuIHRoaXMueCAhPT0gdW5kZWZpbmVkICYmXG5cdFx0XHQhaW50ZXJzZWN0aW9uRmluZGVyLmludGVyc2VjdGlvbnModGhpcy5sYXllciwgdGhpcy5ib3VuZHMpLmxlbmd0aFxuXHR9XG5cblx0Y2hlY2tNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcblx0XHRyZXR1cm4gaW50ZXJzZWN0aW9uRmluZGVyLmNhbk1vdmUodGhpcy5sYXllciwgdGhpcy5ib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKTtcblx0fVxuXG5cdHNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcblx0XHRsZXQgaW50ZXJzZWN0aW9uTW92ZSA9IGludGVyc2VjdGlvbkZpbmRlci5jYW5Nb3ZlKHRoaXMubGF5ZXIsIHRoaXMuYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgbm9TbGlkZSk7XG5cdFx0dGhpcy5tb3ZlKGludGVyc2VjdGlvbk1vdmUueCwgaW50ZXJzZWN0aW9uTW92ZS55KTtcblx0XHRpbnRlcnNlY3Rpb25Nb3ZlLnRyYWNrZWRPbmx5UmVmZXJlbmNlcy5mb3JFYWNoKHJlZmVyZW5jZSA9PiByZWZlcmVuY2UucXVldWVUcmFja2VkSW50ZXJzZWN0aW9uKHRoaXMpKTtcblx0XHRyZXR1cm4gaW50ZXJzZWN0aW9uTW92ZTtcblx0fVxuXG5cdG1vdmUoZHgsIGR5KSB7XG5cdFx0dGhpcy54ICs9IGR4O1xuXHRcdHRoaXMueSArPSBkeTtcblx0XHR0aGlzLnNldE1vdmVEaXJlY3Rpb24oZHgsIGR5KTtcblx0XHR0aGlzLnNldEJvdW5kcygpO1xuXHR9XG5cblx0c2V0TW92ZURpcmVjdGlvbihkeCwgZHkpIHtcblx0XHRpZiAoZHggfHwgZHkpXG5cdFx0XHR0aGlzLm1vdmVEaXJlY3Rpb24gPSBzZXRNYWduaXR1ZGUoZHgsIGR5KTtcblx0fVxuXG5cdGFkZEludGVyc2VjdGlvbkJvdW5kcyhpbnRlcnNlY3Rpb25GaW5kZXIpIHtcblx0XHR0aGlzLmludGVyc2VjdGlvbkhhbmRsZSA9IGludGVyc2VjdGlvbkZpbmRlci5hZGRCb3VuZHModGhpcy5sYXllciwgdGhpcy5ib3VuZHMsIHRoaXMpO1xuXHR9XG5cblx0cmVtb3ZlSW50ZXJzZWN0aW9uQm91bmRzKGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGludGVyc2VjdGlvbkZpbmRlci5yZW1vdmVCb3VuZHModGhpcy5sYXllciwgdGhpcy5pbnRlcnNlY3Rpb25IYW5kbGUpO1xuXHR9XG5cblx0c2V0Qm91bmRzKCkge1xuXHRcdGxldCBoYWxmV2lkdGggPSB0aGlzLndpZHRoIC8gMjtcblx0XHRsZXQgaGFsZkhlaWdodCA9IHRoaXMuaGVpZ2h0IC8gMjtcblx0XHR0aGlzLmJvdW5kcy5zZXQodGhpcy54IC0gaGFsZldpZHRoLCB0aGlzLnkgLSBoYWxmSGVpZ2h0LCB0aGlzLnggKyBoYWxmV2lkdGgsIHRoaXMueSArIGhhbGZIZWlnaHQpO1xuXHR9XG5cblx0cXVldWVUcmFja2VkSW50ZXJzZWN0aW9uKHJlZmVyZW5jZSkge1xuXHRcdHRoaXMucXVldWVkVHJhY2tlZEludGVyc2VjdGlvbnMucHVzaChyZWZlcmVuY2UpO1xuXHR9XG5cblx0Y2hhbmdlSGVhbHRoKGFtb3VudCkge1xuXHR9XG5cblx0cmVtb3ZlVWkoKSB7XG5cdFx0Lyogb3ZlcnJpZGUsIHJldHVybiB0cnVlIGlmIHVpIGlzIG5vdCBsb25nZXIgcmVsZXZhbnQgYW5kIHNob3VsZCBiZSByZW1vdmVkIGZyb20gdGhlIHVpIHF1ZXVlICovXG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHR0aGlzLmdyYXBoaWNzLnBhaW50KHBhaW50ZXIsIGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMubW92ZURpcmVjdGlvbik7XG5cdH1cblxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcbmNvbnN0IFBvb2wgPSByZXF1aXJlKCcuLi91dGlsL1Bvb2wnKTtcblxuY2xhc3MgTGl2aW5nRW50aXR5IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgaGVhbHRoLCBsYXllcikge1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKTtcblx0XHR0aGlzLmhlYWx0aCA9IG5ldyBQb29sKGhlYWx0aCk7XG5cdFx0dGhpcy5zdGF0cyA9IHthcm1vcjogMX07XG5cdH1cblxuXHRzZXRTdGF0cyhzdGF0cykge1xuXHRcdHRoaXMuc3RhdHMgPSB7Li4udGhpcy5zdGF0cywgLi4uc3RhdHN9O1xuXHR9XG5cblx0Y2hhbmdlSGVhbHRoKGFtb3VudCkge1xuXHRcdHRoaXMuaGVhbHRoLmNoYW5nZShhbW91bnQgLyB0aGlzLnN0YXRzLmFybW9yKTtcblx0fVxuXG5cdHJlc3RvcmVIZWFsdGgoKSB7XG5cdFx0dGhpcy5oZWFsdGgucmVzdG9yZSgpO1xuXHR9XG5cblx0cmVtb3ZlVWkoKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGVhbHRoLmlzRW1wdHkoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpdmluZ0VudGl0eTtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0R3JhcGhpYyA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL1JlY3RHcmFwaGljJyk7XG5cbmNsYXNzIE1hcEJvdW5kYXJ5IGV4dGVuZHMgRW50aXR5IHtcblx0c3RhdGljIGNyZWF0ZUJveEJvdW5kYXJpZXMod2lkdGgsIGhlaWdodCkge1xuXHRcdGNvbnN0IGIgPSAuMTtcblx0XHRyZXR1cm4gW1xuXHRcdFx0Wy1iIC8gMiwgaGVpZ2h0IC8gMiwgYiwgaGVpZ2h0ICsgYiAqIDJdLCAvLyBsZWZ0XG5cdFx0XHRbd2lkdGggLyAyLCAtYiAvIDIsIHdpZHRoICsgYiAqIDIsIGJdLCAvLyB0b3Bcblx0XHRcdFt3aWR0aCArIGIgLyAyLCBoZWlnaHQgLyAyLCBiLCBoZWlnaHQgKyBiICogMl0sIC8vIHJpZ2h0XG5cdFx0XHRbd2lkdGggLyAyLCBoZWlnaHQgKyBiIC8gMiwgd2lkdGggKyBiICogMiwgYl0sIC8vIGJvdHRvbVxuXHRcdF0ubWFwKHh5V2lkdGhIZWlnaHQgPT5cblx0XHRcdG5ldyBNYXBCb3VuZGFyeSguLi54eVdpZHRoSGVpZ2h0KSk7XG5cdH1cblxuXHRjb25zdHJ1Y3RvciguLi54eVdpZHRoSGVpZ2h0KSB7XG5cdFx0c3VwZXIoLi4ueHlXaWR0aEhlaWdodCwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5QQVNTSVZFKTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSZWN0R3JhcGhpYyh4eVdpZHRoSGVpZ2h0WzJdLCB4eVdpZHRoSGVpZ2h0WzNdLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTUFQX0JPVU5EQVJZLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwQm91bmRhcnk7XG4iLCJjb25zdCBMaXZpbmdFbnRpdHkgPSByZXF1aXJlKCcuL0xpdmluZ0VudGl0eScpO1xyXG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XHJcbmNvbnN0IHtDb2xvcnMsIFBvc2l0aW9uc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBWU2hpcCA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL1ZTaGlwJyk7XHJcbmNvbnN0IFBvb2wgPSByZXF1aXJlKCcuLi91dGlsL1Bvb2wnKTtcclxuY29uc3QgUHJvamVjdGlsZUF0dGFjayA9IHJlcXVpcmUoJy4uL2FiaWxpdGllcy9Qcm9qZWN0aWxlQXR0YWNrJyk7XHJcbmNvbnN0IExhc2VyQXR0YWNrID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0xhc2VyQXR0YWNrJyk7XHJcbmNvbnN0IENoYXJnZWRQcm9qZWN0aWxlQXR0YWNrID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0NoYXJnZWRQcm9qZWN0aWxlQXR0YWNrJyk7XHJcbmNvbnN0IERhc2ggPSByZXF1aXJlKCcuLi9hYmlsaXRpZXMvRGFzaCcpO1xyXG5jb25zdCBIZWFsID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0hlYWwnKTtcclxuY29uc3QgQWNjZWxlcmF0ZSA9IHJlcXVpcmUoJy4uL2FiaWxpdGllcy9BY2NlbGVyYXRlJyk7XHJcbmNvbnN0IEJvbWJBdHRhY2sgPSByZXF1aXJlKCcuLi9hYmlsaXRpZXMvQm9tYkF0dGFjaycpO1xyXG5jb25zdCBEZWxheWVkUmVnZW4gPSByZXF1aXJlKCcuLi9hYmlsaXRpZXMvRGVsYXllZFJlZ2VuJyk7XHJcbmNvbnN0IERlY2F5ID0gcmVxdWlyZSgnLi4vdXRpbC9EZWNheScpO1xyXG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi9CdWZmJyk7XHJcbmNvbnN0IEtleW1hcHBpbmcgPSByZXF1aXJlKCcuLi9jb250cm9sL0tleW1hcHBpbmcnKTtcclxuY29uc3QgQm91bmRzID0gcmVxdWlyZSgnLi4vaW50ZXJzZWN0aW9uL0JvdW5kcycpO1xyXG5jb25zdCB7c2V0TWFnbml0dWRlLCBib29sZWFuQXJyYXksIHJhbmQsIHJhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcclxuY29uc3QgRHVzdCA9IHJlcXVpcmUoJy4vcGFydGljbGUvRHVzdCcpO1xyXG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdEMnKTtcclxuY29uc3QgQmFyID0gcmVxdWlyZSgnLi4vcGFpbnRlci9CYXInKTtcclxuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xyXG5cclxuY29uc3QgVEFSR0VUX0xPQ0tfQk9SREVSX1NJWkUgPSAuMDQ7XHJcblxyXG5jbGFzcyBQbGF5ZXIgZXh0ZW5kcyBMaXZpbmdFbnRpdHkge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoMCwgMCwgLjA1LCAuMDUsIDEsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfVU5JVCk7XHJcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBWU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5LlBMQVlFUi5nZXQoKX0pKTtcclxuXHJcblx0XHR0aGlzLnN0YW1pbmEgPSBuZXcgUG9vbCg4MCwgLjEpO1xyXG5cdFx0dGhpcy5hYmlsaXRpZXMgPSBbXHJcblx0XHRcdG5ldyBQcm9qZWN0aWxlQXR0YWNrKCksXHJcblx0XHRcdG5ldyBEYXNoKCksXHJcblx0XHRcdC8vIG5ldyBIZWFsKCksXHJcblx0XHRcdC8vIG5ldyBCb21iQXR0YWNrKCksXHJcblx0XHRdO1xyXG5cdFx0dGhpcy5hYmlsaXRpZXMuZm9yRWFjaCgoYWJpbGl0eSwgaSkgPT4gYWJpbGl0eS5zZXRVaShpKSk7XHJcblxyXG5cdFx0dGhpcy5wYXNzaXZlQWJpbGl0aWVzID0gW1xyXG5cdFx0XHRuZXcgRGVsYXllZFJlZ2VuKCldO1xyXG5cclxuXHRcdHRoaXMuYnVmZnMgPSBbXTtcclxuXHJcblx0XHR0aGlzLnJlY2VudERhbWFnZSA9IG5ldyBEZWNheSguMSwgLjAwMSk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUobWFwLCBjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpIHtcclxuXHRcdHRoaXMucmVmcmVzaCgpO1xyXG5cdFx0dGhpcy5tb3ZlQ29udHJvbChjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIpO1xyXG5cdFx0dGhpcy5hYmlsaXR5Q29udHJvbChtYXAsIGNvbnRyb2xsZXIsIGludGVyc2VjdGlvbkZpbmRlcik7XHJcblx0XHR0aGlzLnRhcmdldExvY2tDb250cm9sKGNvbnRyb2xsZXIsIGludGVyc2VjdGlvbkZpbmRlcik7XHJcblx0XHR0aGlzLmNyZWF0ZU1vdmVtZW50UGFydGljbGUobWFwKTtcclxuXHR9XHJcblxyXG5cdHJlZnJlc2goKSB7XHJcblx0XHR0aGlzLnN0YW1pbmEuaW5jcmVtZW50KCk7XHJcblx0XHR0aGlzLnJlY2VudERhbWFnZS5kZWNheSgpO1xyXG5cdH1cclxuXHJcblx0bW92ZUNvbnRyb2woY29udHJvbGxlciwgaW50ZXJzZWN0aW9uRmluZGVyKSB7XHJcblx0XHRjb25zdCBpbnZTcXJ0MiA9IDEgLyBNYXRoLnNxcnQoMik7XHJcblxyXG5cdFx0bGV0IGxlZnQgPSBLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLk1PVkVfTEVGVCkuYWN0aXZlO1xyXG5cdFx0bGV0IHVwID0gS2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5Db250cm9scy5NT1ZFX1VQKS5hY3RpdmU7XHJcblx0XHRsZXQgcmlnaHQgPSBLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLk1PVkVfUklHSFQpLmFjdGl2ZTtcclxuXHRcdGxldCBkb3duID0gS2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5Db250cm9scy5NT1ZFX0RPV04pLmFjdGl2ZTtcclxuXHJcblx0XHRsZXQgZHggPSAwLCBkeSA9IDA7XHJcblxyXG5cdFx0aWYgKGxlZnQpXHJcblx0XHRcdGR4IC09IDE7XHJcblx0XHRpZiAodXApXHJcblx0XHRcdGR5IC09IDE7XHJcblx0XHRpZiAocmlnaHQpXHJcblx0XHRcdGR4ICs9IDE7XHJcblx0XHRpZiAoZG93bilcclxuXHRcdFx0ZHkgKz0gMTtcclxuXHJcblx0XHRpZiAoZHggJiYgZHkpIHtcclxuXHRcdFx0ZHggPSBNYXRoLnNpZ24oZHgpICogaW52U3FydDI7XHJcblx0XHRcdGR5ID0gTWF0aC5zaWduKGR5KSAqIGludlNxcnQyO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuY3VycmVudE1vdmUgPSBbZHgsIGR5XTtcclxuXHRcdHRoaXMuc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCBkeCwgZHksIC4wMDUgKiBCdWZmLm1vdmVTcGVlZCh0aGlzLmJ1ZmZzKSk7XHJcblx0fVxyXG5cclxuXHRhYmlsaXR5Q29udHJvbChtYXAsIGNvbnRyb2xsZXIsIGludGVyc2VjdGlvbkZpbmRlcikge1xyXG5cdFx0bGV0IGRpcmVjdFRhcmdldCA9IHRoaXMudGFyZ2V0TG9jayB8fCBjb250cm9sbGVyLmdldE1vdXNlKCk7XHJcblx0XHRsZXQgZGlyZWN0ID0ge1xyXG5cdFx0XHR4OiBkaXJlY3RUYXJnZXQueCAtIHRoaXMueCxcclxuXHRcdFx0eTogZGlyZWN0VGFyZ2V0LnkgLSB0aGlzLnlcclxuXHRcdH07XHJcblxyXG5cdFx0dGhpcy5hYmlsaXRpZXNcclxuXHRcdFx0LmZvckVhY2goKGFiaWxpdHksIGluZGV4KSA9PiB7XHJcblx0XHRcdFx0bGV0IHdhbnRBY3RpdmUgPSBLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLkFCSUxJVFlfSVtpbmRleF0pLmFjdGl2ZTtcclxuXHRcdFx0XHRhYmlsaXR5LnVwZGF0ZSh0aGlzLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLCB3YW50QWN0aXZlKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5wYXNzaXZlQWJpbGl0aWVzLmZvckVhY2goKGFiaWxpdHkpID0+XHJcblx0XHRcdGFiaWxpdHkudXBkYXRlKHRoaXMsIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRoaXMsIHRydWUpKTtcclxuXHR9XHJcblxyXG5cdHRhcmdldExvY2tDb250cm9sKGNvbnRyb2xsZXIsIGludGVyc2VjdGlvbkZpbmRlcikge1xyXG5cdFx0aWYgKHRoaXMudGFyZ2V0TG9jayAmJiB0aGlzLnRhcmdldExvY2suaGVhbHRoLmlzRW1wdHkoKSlcclxuXHRcdFx0dGhpcy50YXJnZXRMb2NrID0gbnVsbDtcclxuXHJcblx0XHRpZiAoIUtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuVEFSR0VUX0xPQ0spLnByZXNzZWQpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRpZiAodGhpcy50YXJnZXRMb2NrKSB7XHJcblx0XHRcdHRoaXMudGFyZ2V0TG9jayA9IG51bGw7XHJcblx0XHRcdHJldHVybjtcclxuXHRcdH1cclxuXHJcblx0XHRsZXQgbW91c2UgPSBjb250cm9sbGVyLmdldE1vdXNlKCk7XHJcblx0XHRsZXQgdGFyZ2V0TG9ja0JvdW5kcyA9IG5ldyBCb3VuZHMoXHJcblx0XHRcdG1vdXNlLnggLSBUQVJHRVRfTE9DS19CT1JERVJfU0laRSAvIDIsXHJcblx0XHRcdG1vdXNlLnkgLSBUQVJHRVRfTE9DS19CT1JERVJfU0laRSAvIDIsXHJcblx0XHRcdG1vdXNlLnggKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSAvIDIsXHJcblx0XHRcdG1vdXNlLnkgKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSAvIDIpO1xyXG5cdFx0dGhpcy50YXJnZXRMb2NrID0gaW50ZXJzZWN0aW9uRmluZGVyLmhhc0ludGVyc2VjdGlvbihJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkhPU1RJTEVfVU5JVCwgdGFyZ2V0TG9ja0JvdW5kcyk7XHJcblx0fVxyXG5cclxuXHRjcmVhdGVNb3ZlbWVudFBhcnRpY2xlKG1hcCkge1xyXG5cdFx0Y29uc3QgUkFURSA9IC4yLCBTSVpFID0gLjAwNSwgRElSRUNUX1ZFTE9DSVRZID0gLjAwMywgUkFORF9WRUxPQ0lUWSA9IC4wMDE7XHJcblxyXG5cdFx0aWYgKCFib29sZWFuQXJyYXkodGhpcy5jdXJyZW50TW92ZSkgfHwgcmFuZCgpID4gUkFURSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGxldCBkaXJlY3R2ID0gc2V0TWFnbml0dWRlKC4uLnRoaXMuY3VycmVudE1vdmUsIC1ESVJFQ1RfVkVMT0NJVFkpO1xyXG5cdFx0bGV0IHJhbmR2ID0gcmFuZFZlY3RvcihSQU5EX1ZFTE9DSVRZKTtcclxuXHJcblx0XHRtYXAuYWRkUGFydGljbGUobmV3IER1c3QodGhpcy54LCB0aGlzLnksIFNJWkUsIGRpcmVjdHYueCArIHJhbmR2WzBdLCBkaXJlY3R2LnkgKyByYW5kdlsxXSwgMTAwKSk7XHJcblx0fVxyXG5cclxuXHRzdWZmaWNpZW50U3RhbWluYShhbW91bnQpIHtcclxuXHRcdHJldHVybiBhbW91bnQgPD0gdGhpcy5zdGFtaW5hLmdldCgpO1xyXG5cdH1cclxuXHJcblx0Y29uc3VtZVN0YW1pbmEoYW1vdW50KSB7XHJcblx0XHR0aGlzLnN0YW1pbmEuY2hhbmdlKC1hbW91bnQpO1xyXG5cdH1cclxuXHJcblx0Y2hhbmdlSGVhbHRoKGFtb3VudCkge1xyXG5cdFx0c3VwZXIuY2hhbmdlSGVhbHRoKGFtb3VudCk7XHJcblx0XHR0aGlzLnJlY2VudERhbWFnZS5hZGQoLWFtb3VudCk7XHJcblx0fVxyXG5cclxuXHRhZGRCdWZmKCkge1xyXG5cdFx0bGV0IGJ1ZmYgPSBuZXcgQnVmZigpO1xyXG5cdFx0dGhpcy5idWZmcy5wdXNoKGJ1ZmYpO1xyXG5cdFx0cmV0dXJuIGJ1ZmY7XHJcblx0fVxyXG5cclxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xyXG5cdFx0Ly8gdGFyZ2V0IGxvY2tcclxuXHRcdC8vIHRvZG8gW21lZGl1bV0gdGFyZ2V0IGxvY2sgZHJhd3Mgb3ZlciBtb25zdGVyIGhlYWx0aCBiYXJcclxuXHRcdGlmICh0aGlzLnRhcmdldExvY2spXHJcblx0XHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLnRhcmdldExvY2sueCwgdGhpcy50YXJnZXRMb2NrLnksXHJcblx0XHRcdFx0dGhpcy50YXJnZXRMb2NrLndpZHRoICsgVEFSR0VUX0xPQ0tfQk9SREVSX1NJWkUsIHRoaXMudGFyZ2V0TG9jay5oZWlnaHQgKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSxcclxuXHRcdFx0XHR7Y29sb3I6IENvbG9ycy5UQVJHRVRfTE9DSy5nZXQoKSwgdGhpY2tuZXNzOiAzfSkpO1xyXG5cclxuXHRcdC8vIGxpZmUgJiBzdGFtaW5hIGJhclxyXG5cdFx0Y29uc3QgSEVJR0hUX1dJVEhfTUFSR0lOID0gUG9zaXRpb25zLkJBUl9IRUlHSFQgKyBQb3NpdGlvbnMuTUFSR0lOO1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IEJhcihQb3NpdGlvbnMuUExBWUVSX0JBUl9YLCAxIC0gSEVJR0hUX1dJVEhfTUFSR0lOLCAxIC0gUG9zaXRpb25zLlBMQVlFUl9CQVJfWCAtIFBvc2l0aW9ucy5NQVJHSU4sIFBvc2l0aW9ucy5CQVJfSEVJR0hULCB0aGlzLnN0YW1pbmEuZ2V0UmF0aW8oKSwgQ29sb3JzLlNUQU1JTkEuZ2V0U2hhZGUoQ29sb3JzLkJBUl9TSEFESU5HKSwgQ29sb3JzLlNUQU1JTkEuZ2V0KCksIENvbG9ycy5TVEFNSU5BLmdldChDb2xvcnMuQkFSX1NIQURJTkcpKSk7XHJcblx0XHRwYWludGVyLmFkZChuZXcgQmFyKFBvc2l0aW9ucy5QTEFZRVJfQkFSX1gsIDEgLSBIRUlHSFRfV0lUSF9NQVJHSU4gKiAyLCAxIC0gUG9zaXRpb25zLlBMQVlFUl9CQVJfWCAtIFBvc2l0aW9ucy5NQVJHSU4sIFBvc2l0aW9ucy5CQVJfSEVJR0hULCB0aGlzLmhlYWx0aC5nZXRSYXRpbygpLCBDb2xvcnMuTElGRS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpLCBDb2xvcnMuTElGRS5nZXQoKSwgQ29sb3JzLkxJRkUuZ2V0KENvbG9ycy5CQVJfU0hBRElORykpKTtcclxuXHJcblx0XHQvLyBhYmlsaXRpZXNcclxuXHRcdHRoaXMuYWJpbGl0aWVzLmZvckVhY2goYWJpbGl0eSA9PiBhYmlsaXR5LnBhaW50VWkocGFpbnRlciwgY2FtZXJhKSk7XHJcblxyXG5cdFx0Ly8gZGFtYWdlIG92ZXJsYXlcclxuXHRcdGxldCBkYW1hZ2VDb2xvciA9IENvbG9ycy5EQU1BR0UuZ2V0QWxwaGEodGhpcy5yZWNlbnREYW1hZ2UuZ2V0KCkpO1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QoMCwgMCwgMSwgMSwge2ZpbGw6IHRydWUsIGNvbG9yOiBkYW1hZ2VDb2xvcn0pKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGxheWVyO1xyXG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUm9ja0dyYXBoaWMgPSByZXF1aXJlKCcuLi9ncmFwaGljcy9Sb2NrR3JhcGhpYycpO1xuXG5jbGFzcyBSb2NrIGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgc2l6ZSkge1xuXHRcdHN1cGVyKHgsIHksIHNpemUsIHNpemUsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuUEFTU0lWRSk7XG5cdFx0dGhpcy5zZXRHcmFwaGljcyhuZXcgUm9ja0dyYXBoaWMoc2l6ZSwgc2l6ZSwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5LlJPQ0suZ2V0KCl9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb2NrO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFJvY2tHcmFwaGljID0gcmVxdWlyZSgnLi4vZ3JhcGhpY3MvUm9ja0dyYXBoaWMnKTtcblxuY2xhc3MgUm9ja01pbmVyYWwgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCBzaXplKSB7XG5cdFx0c3VwZXIoeCwgeSwgc2l6ZSwgc2l6ZSwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5QQVNTSVZFKTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSb2NrR3JhcGhpYyhzaXplLCBzaXplLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuUk9DS19NSU5FUkFMLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm9ja01pbmVyYWw7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtnZXRSZWN0RGlzdGFuY2V9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBBcmVhRGVnZW4gZXh0ZW5kcyBFbnRpdHkge1xuXHQvLyBpZiBtYXhUYXJnZXRzIDw9IDAsIHdpbGwgYmUgdHJlYXRlZCBhcyBpbmZpbml0ZVxuXHRjb25zdHJ1Y3Rvcih4LCB5LCByYW5nZSwgdGltZSwgZGFtYWdlLCBmcmllbmRseSkge1xuXHRcdGxldCBsYXllciA9IGZyaWVuZGx5ID8gSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5GUklFTkRMWV9QUk9KRUNUSUxFIDogSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5IT1NUSUxFX1BST0pFQ1RJTEU7XG5cdFx0c3VwZXIoeCwgeSwgcmFuZ2UsIHJhbmdlLCBsYXllcik7XG5cdFx0dGhpcy5yYW5nZSA9IHJhbmdlO1xuXHRcdHRoaXMudGltZSA9IHRpbWU7IC8vIC0xIHdpbGwgYmUgaW5maW5pdGUsIDAgd2lsbCBiZSAxIHRpY2tcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGludGVyc2VjdGlvbkZpbmRlci5pbnRlcnNlY3Rpb25zKHRoaXMubGF5ZXIsIHRoaXMuYm91bmRzKVxuXHRcdFx0LmZvckVhY2gobW9uc3RlciA9PiBtb25zdGVyLmNoYW5nZUhlYWx0aCgtdGhpcy5kYW1hZ2UpKTtcblx0XHRyZXR1cm4gIXRoaXMudGltZS0tO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhLCB3YXJuaW5nID0gZmFsc2UpIHtcblx0XHRsZXQgZ3JhcGhpY09wdGlvbnMgPSB3YXJuaW5nID9cblx0XHRcdHtjb2xvcjogQ29sb3JzLkVudGl0eS5BUkVBX0RFR0VOLldBUk5JTkdfQk9SREVSLmdldCgpfSA6XG5cdFx0XHR7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuQVJFQV9ERUdFTi5BQ1RJVkVfRklMTC5nZXQoKX07XG5cdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsXG5cdFx0XHR0aGlzLngsIHRoaXMueSxcblx0XHRcdHRoaXMucmFuZ2UsIHRoaXMucmFuZ2UsXG5cdFx0XHRncmFwaGljT3B0aW9ucykpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXJlYURlZ2VuO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Z2V0UmVjdERpc3RhbmNlfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgQm9tYiBleHRlbmRzIEVudGl0eSB7XG5cdC8vIGlmIG1heFRhcmdldHMgPD0gMCwgd2lsbCBiZSB0cmVhdGVkIGFzIGluZmluaXRlXG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhbmdlLCB0aW1lLCBkYW1hZ2UsIG1heFRhcmdldHMsIGZyaWVuZGx5KSB7XG5cdFx0bGV0IGxheWVyID0gZnJpZW5kbHkgPyBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUgOiBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLkhPU1RJTEVfUFJPSkVDVElMRTtcblx0XHRzdXBlcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBsYXllcik7XG5cdFx0dGhpcy5yYW5nZSA9IHJhbmdlO1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdFx0dGhpcy5tYXhUYXJnZXRzID0gbWF4VGFyZ2V0cztcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGlmICh0aGlzLnRpbWUtLSlcblx0XHRcdHJldHVybjtcblxuXHRcdGxldCB0YXJnZXRzQ291bnQgPSB0aGlzLm1heFRhcmdldHM7XG5cdFx0bWFwLm1vbnN0ZXJzLmZpbmQobW9uc3RlciA9PiB7XG5cdFx0XHRsZXQgdGFyZ2V0RGlzdGFuY2UgPSBnZXRSZWN0RGlzdGFuY2UobW9uc3Rlci54IC0gdGhpcy54LCBtb25zdGVyLnkgLSB0aGlzLnkpO1xuXHRcdFx0aWYgKHRhcmdldERpc3RhbmNlIDwgdGhpcy5yYW5nZSkge1xuXHRcdFx0XHRtb25zdGVyLmNoYW5nZUhlYWx0aCgtdGhpcy5kYW1hZ2UpO1xuXHRcdFx0XHRyZXR1cm4gIS0tdGFyZ2V0c0NvdW50O1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMucmFuZ2UgKiAyLCB0aGlzLnJhbmdlICogMiwge2NvbG9yOiBDb2xvcnMuRW50aXR5LkJvbWIuV0FSTklOR19CT1JERVIuZ2V0KCl9KSk7XG5cdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHRoaXMueCwgdGhpcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2NvbG9yOiBDb2xvcnMuRW50aXR5LkJvbWIuRU5USVRZLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQm9tYjtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgTGluZSA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvTGluZScpO1xuXG5jbGFzcyBMYXNlciBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIGR4LCBkeSwgd2lkdGgsIHRpbWUsIGRhbWFnZSwgZnJpZW5kbHkpIHtcblx0XHRsZXQgbGF5ZXIgPSBmcmllbmRseSA/IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSA6IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFO1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCB3aWR0aCwgbGF5ZXIpO1xuXHRcdHRoaXMuZHggPSBkeDtcblx0XHR0aGlzLmR5ID0gZHk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdCh7eDogdGhpcy5tb3ZlWCwgeTogdGhpcy5tb3ZlWSwgcmVmZXJlbmNlOiB0aGlzLmludGVyc2VjdGlvbn0gPVxuXHRcdFx0dGhpcy5jaGVja01vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLmR4LCB0aGlzLmR5LCAtMSwgdHJ1ZSkpO1xuXG5cdFx0aWYgKHRoaXMuaW50ZXJzZWN0aW9uKVxuXHRcdFx0dGhpcy5pbnRlcnNlY3Rpb24uY2hhbmdlSGVhbHRoKC10aGlzLmRhbWFnZSk7XG5cblx0XHRyZXR1cm4gIXRoaXMudGltZS0tO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0cGFpbnRlci5hZGQoTGluZS53aXRoQ2FtZXJhKFxuXHRcdFx0Y2FtZXJhLFxuXHRcdFx0dGhpcy54LCB0aGlzLnksXG5cdFx0XHR0aGlzLnggKyB0aGlzLm1vdmVYLCB0aGlzLnkgKyB0aGlzLm1vdmVZLFxuXHRcdFx0dGhpcy53aWR0aCxcblx0XHRcdHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5IT1NUSUxFX1BST0pFQ1RJTEUuZ2V0KCl9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMYXNlcjtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge3JhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IERhbWFnZUR1c3QgPSByZXF1aXJlKCcuLi9wYXJ0aWNsZS9EYW1hZ2VEdXN0Jyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgUHJvamVjdGlsZSBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIHZ4LCB2eSwgdGltZSwgZGFtYWdlLCBmcmllbmRseSkge1xuXHRcdGxldCBsYXllciA9IGZyaWVuZGx5ID8gSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5GUklFTkRMWV9QUk9KRUNUSUxFIDogSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5IT1NUSUxFX1BST0pFQ1RJTEU7XG5cdFx0c3VwZXIoeCwgeSwgd2lkdGgsIGhlaWdodCwgbGF5ZXIpO1xuXHRcdHRoaXMudnggPSB2eDtcblx0XHR0aGlzLnZ5ID0gdnk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0XHR0aGlzLmNvbG9yID0gZnJpZW5kbHkgPyBDb2xvcnMuRW50aXR5LkZSSUVORExZX1BST0pFQ1RJTEUuZ2V0KCkgOiBDb2xvcnMuRW50aXR5LkhPU1RJTEVfUFJPSkVDVElMRS5nZXQoKVxuXHR9XG5cblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyKSB7IC8vIHRvZG8gW21lZGl1bV0gZml4IG5hbWluZyBkaXNjb25uZWN0LCBtYXAgcmVmZXJzIHRvIGxhc2VycyBhbmQgcHJvamVjdGlsZXMgYXMgcHJvamVjdGlsZXMuIGVudGl0aWVzIHJlZmVyIHRvIGxhc2VyIGFuZCBwcm9qZWN0aWxlIGFzIGF0dGFja3MuIGNyZWF0ZSBwcm9qZWN0aWxlL2F0dGFjayBwYXJlbnQgY2xhc3MgdG8gaGF2ZSB1cGRhdGUgaW50ZXJmYWNlXG5cdFx0Y29uc3QgRlJJQ1RJT04gPSAxO1xuXG5cdFx0bGV0IGludGVyc2VjdGlvbiA9IHRoaXMucXVldWVkVHJhY2tlZEludGVyc2VjdGlvbnNbMF0gfHwgdGhpcy5zYWZlTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIHRoaXMudngsIHRoaXMudnksIC0xLCB0cnVlKS5yZWZlcmVuY2U7XG5cblx0XHRpZiAoaW50ZXJzZWN0aW9uKSB7XG5cdFx0XHRpbnRlcnNlY3Rpb24uY2hhbmdlSGVhbHRoKC10aGlzLmRhbWFnZSk7XG5cdFx0XHRtYXAuYWRkUGFydGljbGUobmV3IERhbWFnZUR1c3QodGhpcy54LCB0aGlzLnksIC4wMDUsIC4uLnJhbmRWZWN0b3IoLjAwMSksIDEwMCkpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnRpbWUtLSlcblx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0dGhpcy52eCAqPSBGUklDVElPTjtcblx0XHR0aGlzLnZ5ICo9IEZSSUNUSU9OO1xuXG5cdFx0Ly8gdG9kbyBbbG93XSBkbyBkYW1hZ2Ugd2hlbiBjb2xsaWRlZCB3aXRoIChhcyBvcHBvc2VkIHRvIHdoZW4gY29sbGlkaW5nKVxuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHRoaXMueCwgdGhpcy55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLmNvbG9yfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvamVjdGlsZTtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XHJcbmNvbnN0IFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvVmVjdG9yJyk7XHJcbmNvbnN0IHtjb3MsIHNpbn0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScsICdSRVZFUlNFJyk7XHJcblxyXG5jbGFzcyBBaW0gZXh0ZW5kcyBNb2R1bGUge1xyXG5cdGNvbmZpZyhvcmlnaW4sIHJvdGF0aW9uU3BlZWQgPSAwLCBza2lybWlzaFRpbWUgPSAwLCBza2lybWlzaERpc3RhbmNlID0gMCwgaW5pdGlhbERpclZlY3RvciA9IG51bGwpIHtcclxuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG5cdFx0dGhpcy5yb3RhdGlvblNwZWVkID0gcm90YXRpb25TcGVlZDtcclxuXHRcdHRoaXMucm90YXRpb25TcGVlZENvcyA9IGNvcyhyb3RhdGlvblNwZWVkKTsgLy8gMCByb3RhdGlvblNwZWVkIG1lYW5zIGluc3RhbnQgcm90YXRpb25cclxuXHRcdHRoaXMucm90YXRpb25TcGVlZFNpbiA9IHNpbihyb3RhdGlvblNwZWVkKTtcclxuXHRcdHRoaXMuc2tpcm1pc2hUaW1lID0gc2tpcm1pc2hUaW1lO1xyXG5cdFx0dGhpcy5za2lybWlzaERpc3RhbmNlID0gc2tpcm1pc2hEaXN0YW5jZTtcclxuXHRcdGlmIChpbml0aWFsRGlyVmVjdG9yKSB7XHJcblx0XHRcdHRoaXMuZGlyID0gaW5pdGlhbERpclZlY3RvcjtcclxuXHRcdFx0dGhpcy5kaXIubWFnbml0dWRlID0gMTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLklOQUNUSVZFKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IGRlbHRhID0gVmVjdG9yLmZyb21PYmoodGFyZ2V0KS5zdWJ0cmFjdChWZWN0b3IuZnJvbU9iaih0aGlzLm9yaWdpbikpO1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5SRVZFUlNFKVxyXG5cdFx0XHRkZWx0YS5uZWdhdGUoKTtcclxuXHJcblx0XHRpZiAodGhpcy5za2lybWlzaFRpbWUpIHtcclxuXHRcdFx0aWYgKCF0aGlzLnNraXJtaXNoVGljaykge1xyXG5cdFx0XHRcdHRoaXMuc2tpcm1pc2hUaWNrID0gdGhpcy5za2lybWlzaFRpbWU7XHJcblx0XHRcdFx0dGhpcy5za2lybWlzaFZlYyA9IFZlY3Rvci5mcm9tUmFuZCh0aGlzLnNraXJtaXNoRGlzdGFuY2UpO1xyXG5cdFx0XHRcdGlmICh0aGlzLnNraXJtaXNoVmVjLmRvdChkZWx0YSkgPiAwKVxyXG5cdFx0XHRcdFx0dGhpcy5za2lybWlzaFZlYy5uZWdhdGUoKTtcclxuXHRcdFx0fVxyXG5cdFx0XHR0aGlzLnNraXJtaXNoVGljay0tO1xyXG5cdFx0XHRkZWx0YS5hZGQodGhpcy5za2lybWlzaFZlYyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCF0aGlzLmRpcikge1xyXG5cdFx0XHR0aGlzLmRpciA9IFZlY3Rvci5mcm9tT2JqKGRlbHRhKTtcclxuXHRcdFx0dGhpcy5kaXIubWFnbml0dWRlID0gMTtcclxuXHRcdH0gZWxzZSBpZiAodGhpcy5yb3RhdGlvblNwZWVkKVxyXG5cdFx0XHR0aGlzLmRpci5yb3RhdGVCeUNvc1NpblRvd2FyZHModGhpcy5yb3RhdGlvblNwZWVkQ29zLCB0aGlzLnJvdGF0aW9uU3BlZWRTaW4sIGRlbHRhKTtcclxuXHRcdGVsc2Uge1xyXG5cdFx0XHR0aGlzLmRpciA9IGRlbHRhO1xyXG5cdFx0XHR0aGlzLmRpci5tYWduaXR1ZGUgPSAxO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuQWltLlN0YWdlcyA9IFN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQWltO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcbmNvbnN0IEFyZWFEZWdlbiA9IHJlcXVpcmUoJy4uL2F0dGFjay9BcmVhRGVnZW4nKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ1dBUk5JTkcnLCAnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XG5cbmNsYXNzIEFyZWFEZWdlbkxheWVyIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uZmlnKG9yaWdpbiwgcmFuZ2UsIGR1cmF0aW9uLCBkYW1hZ2UpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnJhbmdlID0gcmFuZ2U7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdHRoaXMuZGFtYWdlID0gZGFtYWdlO1xuXHRcdHRoaXMud2FybmluZ0FyZWFEZWdlbiA9IHRoaXMuYXJlYURlZ2VuO1xuXHR9XG5cblx0Z2V0IGFyZWFEZWdlbigpIHtcblx0XHRyZXR1cm4gbmV3IEFyZWFEZWdlbih0aGlzLm9yaWdpbi54LCB0aGlzLm9yaWdpbi55LCB0aGlzLnJhbmdlLCB0aGlzLmR1cmF0aW9uLCB0aGlzLmRhbWFnZSwgZmFsc2UpXG5cdH1cblxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuV0FSTklORylcblx0XHRcdHRoaXMud2FybmluZ0FyZWFEZWdlbi5zZXRQb3NpdGlvbih0aGlzLm9yaWdpbi54LCB0aGlzLm9yaWdpbi55KTtcblx0XHRlbHNlIGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuQUNUSVZFKVxuXHRcdFx0bWFwLmFkZFByb2plY3RpbGUodGhpcy5hcmVhRGVnZW4pO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5XQVJOSU5HKVxuXHRcdFx0dGhpcy53YXJuaW5nQXJlYURlZ2VuLnBhaW50KHBhaW50ZXIsIGNhbWVyYSwgdHJ1ZSk7XG5cblx0fVxufVxuXG5BcmVhRGVnZW5MYXllci5TdGFnZXMgPSBTdGFnZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gQXJlYURlZ2VuTGF5ZXI7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xyXG5jb25zdCB7Y29zLCBzaW59ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9WZWN0b3InKTtcclxuXHJcbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcclxuXHJcbmNsYXNzIENoYXNlIGV4dGVuZHMgTW9kdWxlIHtcclxuXHRjb25maWcob3JpZ2luLCBzcGVlZCwgZGlyTW9kdWxlKSB7XHJcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuXHRcdHRoaXMuc3BlZWQgPSBzcGVlZDtcclxuXHRcdHRoaXMuZGlyTW9kdWxlID0gZGlyTW9kdWxlXHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpXHJcblx0XHRcdHRoaXMub3JpZ2luLnNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgdGhpcy5kaXJNb2R1bGUuZGlyLngsIHRoaXMuZGlyTW9kdWxlLmRpci55LCB0aGlzLnNwZWVkKTtcclxuXHR9XHJcbn1cclxuXHJcbi8vIHRvZG8gW21lZGl1bV0gbWF5YmUgY2hhc2UgY2FuIGJlIGEgbW9kdWxlIHVzZWQgaW4gYSBuZWFyL2ZhciBtb2R1bGUgbWFuYWdlclxyXG5cclxuQ2hhc2UuU3RhZ2VzID0gU3RhZ2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDaGFzZTtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuXHJcbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnLCAnQ09PTERPV04nKTtcclxuY29uc3QgUGhhc2VzID0gbWFrZUVudW0oJ1VOVFJJR0dFUkVEJywgJ1RSSUdHRVJFRCcpO1xyXG5cclxuY2xhc3MgQ29vbGRvd24gZXh0ZW5kcyBNb2R1bGVNYW5hZ2VyIHtcclxuXHRjb25maWcoZHVyYXRpb24pIHtcclxuXHRcdHRoaXMuY29vbGRvd24gPSBuZXcgUGhhc2UoZHVyYXRpb24sIDApO1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuSU5BQ1RJVkUpXHJcblx0XHRcdHRoaXMuY29vbGRvd24uc2VxdWVudGlhbFRpY2soKTtcclxuXHRcdGlmICh0aGlzLmNvb2xkb3duLmdldCgpID09PSAxICYmIHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpIHtcclxuXHRcdFx0dGhpcy5jb29sZG93bi5zZXRQaGFzZSgwKTtcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLlRSSUdHRVJFRCk7XHJcblx0XHR9IGVsc2VcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLlVOVFJJR0dFUkVEKTtcclxuXHR9XHJcbn1cclxuXHJcbkNvb2xkb3duLlN0YWdlcyA9IFN0YWdlcztcclxuQ29vbGRvd24uUGhhc2VzID0gUGhhc2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDb29sZG93bjtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xyXG5jb25zdCB7c2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnSU5BQ1RJVkUnLCAnQUlNSU5HJywgJ1dBUk5JTkcnLCAnREFTSElORycpO1xyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnSU5BQ1RJVkUnLCAnQUlNSU5HJywgJ1dBUk5JTkcnLCAnREFTSElORycpO1xyXG5cclxuY2xhc3MgRGFzaCBleHRlbmRzIE1vZHVsZU1hbmFnZXIge1xyXG5cdGNvbmZpZyhvcmlnaW4sIGRpc3RhbmNlLCBkYXNoRHVyYXRpb24pIHtcclxuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG5cdFx0dGhpcy5kaXN0YW5jZSA9IGRpc3RhbmNlO1xyXG5cdFx0dGhpcy5kYXNoRHVyYXRpb24gPSBkYXNoRHVyYXRpb247XHJcblx0XHR0aGlzLnRhcmdldCA9IHt9O1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuREFTSElORylcclxuXHRcdFx0dGhpcy5jb2xsaWRlZCA9IGZhbHNlO1xyXG5cclxuXHRcdC8vIHN0YWdlIHNob3VsZCBiZSBlcXVpdmFsZW50IHRvIHBoYXNlIHVubGVzcyB3ZSd2ZSBjb2xsaWRlZCB3aGlsZSBkYXNoaW5nXHJcblx0XHRpZiAoIXRoaXMuY29sbGlkZWQpXHJcblx0XHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKHRoaXMuc3RhZ2UpO1xyXG5cclxuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuQUlNSU5HKSB7XHJcblx0XHRcdGxldCBkZWx0YSA9IHNldE1hZ25pdHVkZSh0YXJnZXQueCAtIHRoaXMub3JpZ2luLngsIHRhcmdldC55IC0gdGhpcy5vcmlnaW4ueSwgdGhpcy5kaXN0YW5jZSk7XHJcblx0XHRcdHRoaXMudGFyZ2V0LnggPSB0aGlzLm9yaWdpbi54ICsgZGVsdGEueDtcclxuXHRcdFx0dGhpcy50YXJnZXQueSA9IHRoaXMub3JpZ2luLnkgKyBkZWx0YS55O1xyXG5cdFx0XHR0aGlzLmRpciA9IHNldE1hZ25pdHVkZShkZWx0YS54LCBkZWx0YS55KTtcclxuXHJcblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5EQVNISU5HICYmICF0aGlzLmNvbGxpZGVkKSB7XHJcblx0XHRcdHRoaXMuY29sbGlkZWQgPSB0aGlzLm9yaWdpbi5zYWZlTW92ZShpbnRlcnNlY3Rpb25GaW5kZXIsIHRoaXMuZGlyLngsIHRoaXMuZGlyLnksIHRoaXMuZGlzdGFuY2UgLyB0aGlzLmRhc2hEdXJhdGlvbiwgdHJ1ZSkucmVmZXJlbmNlO1xyXG5cdFx0XHRpZiAodGhpcy5jb2xsaWRlZCkge1xyXG5cdFx0XHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKFBoYXNlcy5JTkFDVElWRSk7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQueCA9IHRoaXMub3JpZ2luLng7XHJcblx0XHRcdFx0dGhpcy50YXJnZXQueSA9IHRoaXMub3JpZ2luLnk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbkRhc2guU3RhZ2VzID0gU3RhZ2VzO1xyXG5EYXNoLlBoYXNlcyA9IFBoYXNlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGFzaDtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xyXG5jb25zdCB7Z2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XHJcbi8vIHZhcmlhYmxlIG51bWJlciBvZiBwaGFzZXMgcGVyIG51bWJlciBvZiBhcmd1bWVudHMgdG8gY29uZmlnXHJcblxyXG5jbGFzcyBEaXN0YW5jZSBleHRlbmRzIE1vZHVsZU1hbmFnZXIge1xyXG5cdC8vIGRpc3RhbmNlcyBzaG91bGQgYmUgaW4gaW5jcmVhc2luZyBvcmRlclxyXG5cdC8vIGlmIHRoaXMuZGlzdGFuY2VzID0gWzEwLCAyMF0sIHRoZW4gcGhhc2UgMSA9IFsxMCwgMjApXHJcblx0Y29uZmlnKG9yaWdpbiwgLi4uZGlzdGFuY2VzKSB7XHJcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcclxuXHRcdHRoaXMuZGlzdGFuY2VzID0gZGlzdGFuY2VzO1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuQUNUSVZFKVxyXG5cdFx0XHRyZXR1cm47XHJcblxyXG5cdFx0bGV0IHRhcmdldERpc3RhbmNlID0gZ2V0TWFnbml0dWRlKHRhcmdldC54IC0gdGhpcy5vcmlnaW4ueCwgdGFyZ2V0LnkgLSB0aGlzLm9yaWdpbi55KTtcclxuXHJcblx0XHRsZXQgcGhhc2UgPSB0aGlzLmRpc3RhbmNlcy5maW5kSW5kZXgoZGlzdGFuY2UgPT4gdGFyZ2V0RGlzdGFuY2UgPCBkaXN0YW5jZSk7XHJcblx0XHRpZiAocGhhc2UgPT09IC0xKVxyXG5cdFx0XHRwaGFzZSA9IHRoaXMuZGlzdGFuY2VzLmxlbmd0aDtcclxuXHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKHBoYXNlKTtcclxuXHR9XHJcbn1cclxuXHJcbkRpc3RhbmNlLlN0YWdlcyA9IFN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGlzdGFuY2U7XHJcbiIsImNsYXNzIE1vZHVsZSB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHR0aGlzLnN0YWdlID0gMDtcclxuXHR9XHJcblxyXG5cdGNvbmZpZygpIHtcclxuXHR9XHJcblxyXG5cdHNldFN0YWdlKHN0YWdlKSB7XHJcblx0XHRpZiAoc3RhZ2UgIT09IHVuZGVmaW5lZClcclxuXHRcdFx0dGhpcy5zdGFnZSA9IHN0YWdlXHJcblx0fVxyXG5cclxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHR0aGlzLmFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KTtcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0fVxyXG5cclxuXHRwYWludChwYWludGVyLCBjYW52YXMpIHtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlO1xyXG4iLCJjb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xyXG5cclxuY2xhc3MgTW9kdWxlTWFuYWdlciBleHRlbmRzIE1vZHVsZSB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHRzdXBlcigpO1xyXG5cdFx0dGhpcy5tb2R1bGVzID0gW107XHJcblx0XHR0aGlzLnBoYXNlID0gLTE7XHJcblx0fVxyXG5cclxuXHRhZGRNb2R1bGUobW9kdWxlLCBzdGFnZXNNYXApIHtcclxuXHRcdHRoaXMubW9kdWxlcy5wdXNoKHttb2R1bGUsIHN0YWdlc01hcH0pO1xyXG5cdH1cclxuXHJcblx0Ly8gdG9kbyBbbWVkXSByZW5hbWUgdG8gc2V0UGhhc2VcclxuXHRtb2R1bGVzU2V0U3RhZ2UocGhhc2UpIHtcclxuXHRcdGlmIChwaGFzZSA9PT0gdGhpcy5waGFzZSlcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0dGhpcy5waGFzZSA9IHBoYXNlO1xyXG5cdFx0dGhpcy5tb2R1bGVzLmZvckVhY2goKHttb2R1bGUsIHN0YWdlc01hcH0pID0+XHJcblx0XHRcdG1vZHVsZS5zZXRTdGFnZShzdGFnZXNNYXBbcGhhc2VdKSk7XHJcblx0fVxyXG5cclxuXHRhcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHR0aGlzLmFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KTtcclxuXHRcdHRoaXMubW9kdWxlcy5mb3JFYWNoKCh7bW9kdWxlfSkgPT5cclxuXHRcdFx0bW9kdWxlLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpKTtcclxuXHR9XHJcblxyXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xyXG5cdFx0dGhpcy5tb2R1bGVzLmZvckVhY2goKHttb2R1bGV9KSA9PlxyXG5cdFx0XHRtb2R1bGUucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1vZHVsZU1hbmFnZXI7XHJcblxyXG4vLyB0b2RvIFtsb3ddIGNvbnNpZGVyIG1lcmdpbmcgbW9kdWxlTWFuYWdlciBhbmQgbW9kdWxlXHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xuY29uc3QgQXJlYURlZ2VuID0gcmVxdWlyZSgnLi4vYXR0YWNrL0FyZWFEZWdlbicpO1xuXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnV0FSTklORycsICdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcblxuY2xhc3MgTmVhcmJ5RGVnZW4gZXh0ZW5kcyBNb2R1bGUge1xuXHRjb25maWcob3JpZ2luLCByYW5nZSwgZGFtYWdlKSB7XG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XG5cdFx0dGhpcy5hcmVhRGVnZW4gPSBuZXcgQXJlYURlZ2VuKG9yaWdpbi54LCBvcmlnaW4ueSwgcmFuZ2UsIC0xLCBkYW1hZ2UsIGZhbHNlKTtcblx0fVxuXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5JTkFDVElWRSlcblx0XHRcdHRoaXMuYXJlYURlZ2VuLnNldFBvc2l0aW9uKHRoaXMub3JpZ2luLngsIHRoaXMub3JpZ2luLnkpO1xuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuQUNUSVZFKVxuXHRcdFx0dGhpcy5hcmVhRGVnZW4udXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuSU5BQ1RJVkUpXG5cdFx0XHR0aGlzLmFyZWFEZWdlbi5wYWludChwYWludGVyLCBjYW1lcmEsIHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5XQVJOSU5HKTtcblxuXHR9XG59XG5cbk5lYXJieURlZ2VuLlN0YWdlcyA9IFN0YWdlcztcblxubW9kdWxlLmV4cG9ydHMgPSBOZWFyYnlEZWdlbjtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vZHVsZU1hbmFnZXIgPSByZXF1aXJlKCcuL01vZHVsZU1hbmFnZXInKTtcclxuXHJcbmNvbnN0IFByaW1hcnlTdGFnZXMgPSBtYWtlRW51bSgnUExBWScsICdMT09QJywgJ1BBVVNFJywgJ1NUT1AnKTtcclxuLy8gdmFyaWFibGUgbnVtYmVyIG9mIHNlY29uZGFyeSBzdGFnZXMgZGVwZW5kaW5nIG9uIG51bWJlciBvZiBwYXR0ZXJucyBkZWZpbmVkXHJcbi8vIHZhcmlhYmxlIG51bWJlciBvZiBwaGFzZXMgZGVwZW5kaW5nIG9uIG51bWJlciBvZiBwZXJpb2RzIGRlZmluZWRcclxuXHJcbmNsYXNzIHBhdHRlcm5lZFBlcmlvZCBleHRlbmRzIE1vZHVsZU1hbmFnZXIge1xyXG5cdGNvbmZpZyhwZXJpb2RzLCBwYXR0ZXJucywgcXVldWVzKSB7XHJcblx0XHR0aGlzLnBlcmlvZHMgPSBwZXJpb2RzO1xyXG5cdFx0dGhpcy5wYXR0ZXJucyA9IHBhdHRlcm5zO1xyXG5cdFx0Ly8gV2hlbiBzZWNvbmRhcnlTdGFnZSBpcyBzZXQgdG8gaSxcclxuXHRcdC8vIGlmIHF1ZXVlc1tpXSBpcyB0cnVlLCB3aWxsIG5vdCB1cGRhdGUgY3VyUGF0dGVybkkgdG8gaSB1bnRpbCBhZnRlciBjdXJQYXR0ZXJuSSBjb21wbGV0ZXNcclxuXHRcdC8vIGVsc2UgaWYgcXVldWVzW2ldIGlzIGZhbHNlLCB3aWxsIHVwZGF0ZSBjdXJQYXR0ZXJuSSB0byBpIGltbWVkaWF0ZWx5LlxyXG5cdFx0dGhpcy5xdWV1ZXMgPSBxdWV1ZXM7XHJcblx0XHR0aGlzLnNldEN1clBhdHRlcm4oMCk7XHJcblx0fVxyXG5cclxuXHRzZXRDdXJQYXR0ZXJuKHBhdHRlcm5JKSB7XHJcblx0XHR0aGlzLmN1clBhdHRlcm5JID0gcGF0dGVybkk7XHJcblx0XHR0aGlzLmN1clBlcmlvZEkgPSAwO1xyXG5cdFx0dGhpcy5yZXNldER1cmF0aW9uKCk7XHJcblx0fVxyXG5cclxuXHRnZXQgcGVyaW9kKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMucGF0dGVybnNbdGhpcy5jdXJQYXR0ZXJuSV1bdGhpcy5jdXJQZXJpb2RJXTtcclxuXHR9XHJcblxyXG5cdHJlc2V0RHVyYXRpb24oKSB7XHJcblx0XHR0aGlzLmN1ckR1cmF0aW9uID0gdGhpcy5wZXJpb2RzW3RoaXMucGVyaW9kXTtcclxuXHRcdGlmICh0aGlzLmN1ckR1cmF0aW9uKVxyXG5cdFx0XHR0aGlzLmN1ckR1cmF0aW9uKys7XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2VbMF0gPT09IFByaW1hcnlTdGFnZXMuU1RPUClcclxuXHRcdFx0dGhpcy5zZXRDdXJQYXR0ZXJuKDApO1xyXG5cclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2VbMF0gIT09IFByaW1hcnlTdGFnZXMuUEFVU0UpIHtcclxuXHRcdFx0aWYgKHRoaXMuc3RhZ2VbMV0gIT09IHRoaXMuY3VyUGF0dGVybkkgJiYgKCF0aGlzLnF1ZXVlc1t0aGlzLnN0YWdlWzFdXSB8fCAhdGhpcy5jdXJEdXJhdGlvbikpXHJcblx0XHRcdFx0dGhpcy5zZXRDdXJQYXR0ZXJuKHRoaXMuc3RhZ2VbMV0pO1xyXG5cdFx0XHRpZiAodGhpcy5jdXJEdXJhdGlvbiAmJiAhLS10aGlzLmN1ckR1cmF0aW9uKSB7XHJcblx0XHRcdFx0aWYgKHRoaXMuY3VyUGVyaW9kSSA8IHRoaXMucGF0dGVybnNbdGhpcy5jdXJQYXR0ZXJuSV0ubGVuZ3RoIC0gMSlcclxuXHRcdFx0XHRcdHRoaXMuY3VyUGVyaW9kSSsrO1xyXG5cdFx0XHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2VbMV0gIT09IHRoaXMuY3VyUGF0dGVybkkpXHJcblx0XHRcdFx0XHR0aGlzLnNldEN1clBhdHRlcm4odGhpcy5zdGFnZVsxXSk7XHJcblx0XHRcdFx0ZWxzZSBpZiAodGhpcy5zdGFnZVswXSA9PT0gUHJpbWFyeVN0YWdlcy5MT09QKVxyXG5cdFx0XHRcdFx0dGhpcy5jdXJQZXJpb2RJID0gMDtcclxuXHRcdFx0XHR0aGlzLnJlc2V0RHVyYXRpb24oKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKHRoaXMucGVyaW9kKTtcclxuXHR9XHJcbn1cclxuXHJcbnBhdHRlcm5lZFBlcmlvZC5QcmltYXJ5U3RhZ2VzID0gUHJpbWFyeVN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcGF0dGVybmVkUGVyaW9kO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XHJcbmNvbnN0IFBoYXNlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9QaGFzZScpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ1BMQVknLCAnTE9PUCcsICdQQVVTRScsICdTVE9QJyk7XHJcbi8vIHZhcmlhYmxlIG51bWJlciBvZiBwaGFzZXMgcGVyIG51bWJlciBvZiBhcmd1bWVudHMgdG8gY29uZmlnXHJcblxyXG5jbGFzcyBQZXJpb2QgZXh0ZW5kcyBNb2R1bGVNYW5hZ2VyIHtcclxuXHRjb25maWcoLi4ucGVyaW9kcykge1xyXG5cdFx0dGhpcy5wZXJpb2RDb3VudCA9IHBlcmlvZHMubGVuZ3RoO1xyXG5cdFx0dGhpcy5wZXJpb2RzID0gbmV3IFBoYXNlKC4uLnBlcmlvZHMsIDApO1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuU1RPUClcclxuXHRcdFx0dGhpcy5wZXJpb2RzLnNldFBoYXNlKDApO1xyXG5cclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5QQVVTRSkge1xyXG5cdFx0XHR0aGlzLnBlcmlvZHMuc2VxdWVudGlhbFRpY2soKTtcclxuXHRcdFx0aWYgKHRoaXMucGVyaW9kcy5nZXQoKSA9PT0gdGhpcy5wZXJpb2RDb3VudCAmJiB0aGlzLnN0YWdlID09PSBTdGFnZXMuTE9PUClcclxuXHRcdFx0XHR0aGlzLnBlcmlvZHMuc2V0UGhhc2UoMCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UodGhpcy5wZXJpb2RzLmdldCgpKTtcclxuXHR9XHJcbn1cclxuXHJcblBlcmlvZC5TdGFnZXMgPSBTdGFnZXM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBlcmlvZDtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcclxuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9WZWN0b3InKTtcclxuY29uc3Qge2Nvcywgc2lufSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XHJcblxyXG5jbGFzcyBQb3NpdGlvbiBleHRlbmRzIE1vZHVsZSB7XHJcblx0Y29uZmlnKG9yaWdpbiA9IG51bGwsIHJhbmRNaW5NYWcgPSAwLCByYW5kTWF4TWFnID0gMCkge1xyXG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47IC8vIGlmIG51bGwsIHdpbGwgdXNlIHRhcmdldFxyXG5cdFx0dGhpcy5yYW5kTWluTWFnID0gcmFuZE1pbk1hZztcclxuXHRcdHRoaXMucmFuZE1heE1hZyA9IHJhbmRNYXhNYWc7XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpXHJcblx0XHRcdCh7eDogdGhpcy54LCB5OiB0aGlzLnl9ID1cclxuXHRcdFx0XHRWZWN0b3IuZnJvbU9iaih0aGlzLm9yaWdpbiB8fCB0YXJnZXQpLmFkZChWZWN0b3IuZnJvbVJhbmQodGhpcy5yYW5kTWluTWFnLCB0aGlzLnJhbmRNYXhNYWcpKSk7XHJcblx0fVxyXG59XHJcblxyXG5Qb3NpdGlvbi5TdGFnZXMgPSBTdGFnZXM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBvc2l0aW9uO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xyXG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi91dGlsL1ZlY3RvcicpO1xyXG5jb25zdCB7dGhldGFUb1ZlY3Rvcn0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScpO1xyXG5cclxuY2xhc3MgUm90YXRlIGV4dGVuZHMgTW9kdWxlIHtcclxuXHRjb25maWcob3JpZ2luLCByYXRlID0gMSAvIDUwLCB0aGV0YSA9IDAsIGF0VGFyZ2V0ID0gZmFsc2UpIHtcclxuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG5cdFx0dGhpcy5yYXRlID0gcmF0ZTtcclxuXHRcdHRoaXMudGhldGEgPSB0aGV0YTtcclxuXHRcdHRoaXMuYXRUYXJnZXQgPSBhdFRhcmdldDtcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLklOQUNUSVZFKVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHRpZiAodGhpcy5hdFRhcmdldCkge1xyXG5cdFx0XHRsZXQgZGVsdGEgPSBWZWN0b3IuZnJvbU9iaih0YXJnZXQpLnN1YnRyYWN0KFZlY3Rvci5mcm9tT2JqKHRoaXMub3JpZ2luKSk7XHJcblx0XHRcdHRoaXMub3JpZ2luLnNldE1vdmVEaXJlY3Rpb24oZGVsdGEueCwgZGVsdGEueSk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0aGlzLnRoZXRhICs9IHRoaXMucmF0ZTtcclxuXHRcdFx0dGhpcy5vcmlnaW4uc2V0TW92ZURpcmVjdGlvbiguLi50aGV0YVRvVmVjdG9yKHRoaXMudGhldGEpKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcblJvdGF0ZS5TdGFnZXMgPSBTdGFnZXM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJvdGF0ZTtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vYXR0YWNrL1Byb2plY3RpbGUnKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScpO1xuXG5jbGFzcyBTaG90Z3VuIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uZmlnKG9yaWdpbiwgcmF0ZSwgY291bnQsIHZlbG9jaXR5LCBzcHJlYWQsIGR1cmF0aW9uLCBkYW1hZ2UsIGRpck1vZHVsZSwgcHJlZGljdGFibGVSYXRlID0gZmFsc2UsIHNpemUgPSAuMDIpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnJhdGUgPSByYXRlO1xuXHRcdHRoaXMuY291bnQgPSBjb3VudDtcblx0XHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG5cdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdHRoaXMuZGFtYWdlID0gZGFtYWdlO1xuXHRcdHRoaXMuZGlyTW9kdWxlID0gZGlyTW9kdWxlO1xuXHRcdHRoaXMucHJlZGljdGFibGVSYXRlID0gcHJlZGljdGFibGVSYXRlO1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5yYXRlQ3VycmVudCA9IDA7XG5cdH1cblxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuQUNUSVZFKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGlmICghdGhpcy5wcmVkaWN0YWJsZVJhdGUgJiYgTWF0aC5yYW5kb20oKSA+IHRoaXMucmF0ZSlcblx0XHRcdHJldHVybjtcblx0XHRpZiAodGhpcy5wcmVkaWN0YWJsZVJhdGUgJiYgKHRoaXMucmF0ZUN1cnJlbnQgKz0gdGhpcy5yYXRlKSA8IDEpXG5cdFx0XHRyZXR1cm47XG5cdFx0dGhpcy5yYXRlQ3VycmVudC0tO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvdW50OyBpKyspIHtcblx0XHRcdGxldCBkaXJlY3R2ID0gdGhpcy5kaXJNb2R1bGUuZGlyLmNvcHk7XG5cdFx0XHRkaXJlY3R2Lm1hZ25pdHVkZSA9IHRoaXMudmVsb2NpdHk7XG5cdFx0XHRsZXQgcmFuZHYgPSByYW5kVmVjdG9yKHRoaXMuc3ByZWFkKTtcblxuXHRcdFx0bGV0IHByb2plY3RpbGUgPSBuZXcgUHJvamVjdGlsZShcblx0XHRcdFx0dGhpcy5vcmlnaW4ueCwgdGhpcy5vcmlnaW4ueSxcblx0XHRcdFx0dGhpcy5zaXplLCB0aGlzLnNpemUsXG5cdFx0XHRcdGRpcmVjdHYueCArIHJhbmR2WzBdLCBkaXJlY3R2LnkgKyByYW5kdlsxXSxcblx0XHRcdFx0dGhpcy5kdXJhdGlvbiwgdGhpcy5kYW1hZ2UsIGZhbHNlKTtcblx0XHRcdG1hcC5hZGRQcm9qZWN0aWxlKHByb2plY3RpbGUpO1xuXHRcdH1cblx0fVxufVxuXG5TaG90Z3VuLlN0YWdlcyA9IFN0YWdlcztcblxubW9kdWxlLmV4cG9ydHMgPSBTaG90Z3VuO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi91dGlsL1ZlY3RvcicpO1xuY29uc3QgTGFzZXIgPSByZXF1aXJlKCcuLi9hdHRhY2svTGFzZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IExpbmUgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL0xpbmUnKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ1dBUk5JTkcnLCAnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XG5cbmNsYXNzIFN0YXRpY0xhc2VyIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uZmlnKG9yaWdpbiwgc3ByZWFkLCByYW5nZSwgZGlyTW9kdWxlLCBkdXJhdGlvbiwgZGFtYWdlLCBzaXplID0gLjAyKSB7XG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XG5cdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0dGhpcy5yYW5nZSA9IHJhbmdlO1xuXHRcdHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0XHR0aGlzLnNpemUgPSBzaXplO1xuXHRcdHRoaXMuZGlyTW9kdWxlID0gZGlyTW9kdWxlO1xuXHR9XG5cblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLkFDVElWRSlcblx0XHRcdHJldHVybjtcblxuXHRcdGxldCBkaXIgPSBWZWN0b3IuZnJvbVJhbmQodGhpcy5zcHJlYWQpLmFkZCh0aGlzLmRpck1vZHVsZS5kaXIpO1xuXG5cdFx0bGV0IGxhc2VyID0gbmV3IExhc2VyKFxuXHRcdFx0dGhpcy5vcmlnaW4ueCwgdGhpcy5vcmlnaW4ueSxcblx0XHRcdGRpci54LCBkaXIueSxcblx0XHRcdHRoaXMuc2l6ZSwgdGhpcy5kdXJhdGlvbiwgdGhpcy5kYW1hZ2UsIGZhbHNlKTtcblx0XHRtYXAuYWRkUHJvamVjdGlsZShsYXNlcik7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLldBUk5JTkcpXG5cdFx0XHRyZXR1cm47XG5cdFx0bGV0IHdhcm5pbmcgPSBWZWN0b3IuZnJvbU9iaih0aGlzLm9yaWdpbikuYWRkKHRoaXMuZGlyTW9kdWxlLmRpcik7XG5cdFx0cGFpbnRlci5hZGQoTGluZS53aXRoQ2FtZXJhKFxuXHRcdFx0Y2FtZXJhLFxuXHRcdFx0dGhpcy5vcmlnaW4ueCwgdGhpcy5vcmlnaW4ueSxcblx0XHRcdHdhcm5pbmcueCwgd2FybmluZy55LFxuXHRcdFx0dGhpcy5zaXplLFxuXHRcdFx0e2NvbG9yOiBDb2xvcnMuRW50aXR5LkFSRUFfREVHRU4uV0FSTklOR19CT1JERVIuZ2V0KCl9KSk7XG5cdH1cbn1cblxuU3RhdGljTGFzZXIuU3RhZ2VzID0gU3RhZ2VzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRpY0xhc2VyO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0lOQUNUSVZFJywgJ0FDVElWRScpO1xyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnSU5BQ1RJVkUnLCAnVU5UUklHR0VSRUQnLCAnVFJJR0dFUkVEJyk7XHJcblxyXG5jbGFzcyBUcmlnZ2VyIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XHJcblx0Y29uZmlnKGR1cmF0aW9uKSB7XHJcblx0XHR0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUgJiYgdGhpcy5sYXN0U3RhZ2UgIT09IHRoaXMuc3RhZ2UpIHtcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLlRSSUdHRVJFRCk7XHJcblx0XHRcdHRoaXMuY3VycmVudER1cmF0aW9uID0gdGhpcy5kdXJhdGlvbjtcclxuXHRcdH0gZWxzZSBpZiAodGhpcy5jdXJyZW50RHVyYXRpb24pXHJcblx0XHRcdHRoaXMuY3VycmVudER1cmF0aW9uLS07XHJcblx0XHRlbHNlIGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuSU5BQ1RJVkUpXHJcblx0XHRcdHRoaXMubW9kdWxlc1NldFN0YWdlKFBoYXNlcy5JTkFDVElWRSk7XHJcblx0XHRlbHNlIGlmICh0aGlzLmxhc3RTdGFnZSA9PT0gdGhpcy5zdGFnZSlcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLlVOVFJJR0dFUkVEKTtcclxuXHRcdGVsc2VcclxuXHRcdFx0Y29uc29sZS5lcnJvcignaW1wb3NzaWJsZSBicmFuY2ggcmVhY2hlZC4nKTtcclxuXHRcdHRoaXMubGFzdFN0YWdlID0gdGhpcy5zdGFnZTtcclxuXHR9XHJcbn1cclxuXHJcblRyaWdnZXIuU3RhZ2VzID0gU3RhZ2VzO1xyXG5UcmlnZ2VyLlBoYXNlcyA9IFBoYXNlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJpZ2dlcjtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9uc3RlciA9IHJlcXVpcmUoJy4vTW9uc3RlcicpO1xyXG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFdTaGlwID0gcmVxdWlyZSgnLi4vLi4vZ3JhcGhpY3MvV1NoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uL21vZHVsZS9QZXJpb2QnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vbW9kdWxlL0FpbScpO1xyXG5jb25zdCBDaGFzZSA9IHJlcXVpcmUoJy4uL21vZHVsZS9DaGFzZScpO1xyXG5jb25zdCBTaG90Z3VuID0gcmVxdWlyZSgnLi4vbW9kdWxlL1Nob3RndW4nKTtcclxuY29uc3QgRGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZS9EYXNoJyk7XHJcbmNvbnN0IFRyaWdnZXIgPSByZXF1aXJlKCcuLi9tb2R1bGUvVHJpZ2dlcicpO1xyXG5jb25zdCBOZWFyYnlEZWdlbiA9IHJlcXVpcmUoJy4uL21vZHVsZS9OZWFyYnlEZWdlbicpO1xyXG4vLyBjb25zdCBCb29tZXJhbmcgPSByZXF1aXJlKCcuLi9tb2R1bGUvQm9vbWVyYW5nJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBDaGFtcGlvbiBleHRlbmRzIE1vbnN0ZXIge1xyXG5cdGNvbnN0cnVjdG9yKHgsIHkpIHtcclxuXHRcdHN1cGVyKHgsIHksIC4wNSwgLjA1LCAxKTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFdTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKX0pKTtcclxuXHJcblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xyXG5cclxuXHRcdGxldCBwZXJpb2QgPSBuZXcgUGVyaW9kKCk7XHJcblx0XHRwZXJpb2QuY29uZmlnKDEwMCwgMjUsIDI1LCAzMCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHBlcmlvZCwge1tQaGFzZXMuT05FXTogUGVyaW9kLlN0YWdlcy5MT09QLH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZUFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGNoYXNlQWltLmNvbmZpZyh0aGlzKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoY2hhc2VBaW0sIHtcclxuXHRcdFx0MDogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQyOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlID0gbmV3IENoYXNlKCk7XHJcblx0XHRjaGFzZS5jb25maWcodGhpcywgLjAwNSwgYWltKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoY2hhc2UsIHtcclxuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MTogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgc2hvdGd1bkFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdHNob3RndW5BaW0uY29uZmlnKHRoaXMpO1xyXG5cdFx0cGVyaW9kLmFkZE1vZHVsZShzaG90Z3VuQWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBzaG90Z3VuID0gbmV3IFNob3RndW4oKTtcclxuXHRcdHNob3RndW4uY29uZmlnKHRoaXMsIC4wMywgMSwgLjAxLCAuMDAxLCA1MCwgLjAyLCBzaG90Z3VuQWltKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoc2hvdGd1biwge1xyXG5cdFx0XHQwOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IFNob3RndW4uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGRhc2ggPSBuZXcgRGFzaCgpO1xyXG5cdFx0ZGFzaC5jb25maWcodGhpcywgLjQsIDMwKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoZGFzaCwge1xyXG5cdFx0XHQwOiBEYXNoLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogRGFzaC5TdGFnZXMuQUlNSU5HLFxyXG5cdFx0XHQyOiBEYXNoLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHQzOiBEYXNoLlN0YWdlcy5EQVNISU5HLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IHRyaWdnZXJEYXNoRW5kID0gbmV3IFRyaWdnZXIoKTtcclxuXHRcdHRyaWdnZXJEYXNoRW5kLmNvbmZpZygyMCk7XHJcblx0XHRkYXNoLmFkZE1vZHVsZSh0cmlnZ2VyRGFzaEVuZCwge1xyXG5cdFx0XHRbRGFzaC5QaGFzZXMuSU5BQ1RJVkVdOiBUcmlnZ2VyLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5BSU1JTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLldBUk5JTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLkRBU0hJTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBkYXNoQXR0YWNrVGFyZ2V0ID0gbmV3IE5lYXJieURlZ2VuKCk7XHJcblx0XHRkYXNoQXR0YWNrVGFyZ2V0LmNvbmZpZyhkYXNoLnRhcmdldCwgLjEsIC4wMDIpO1xyXG5cdFx0dHJpZ2dlckRhc2hFbmQuYWRkTW9kdWxlKGRhc2hBdHRhY2tUYXJnZXQsIHtcclxuXHRcdFx0W1RyaWdnZXIuUGhhc2VzLlVOVFJJR0dFUkVEXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRbVHJpZ2dlci5QaGFzZXMuVFJJR0dFUkVEXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cdFx0ZGFzaC5hZGRNb2R1bGUoZGFzaEF0dGFja1RhcmdldCwge1xyXG5cdFx0XHRbRGFzaC5QaGFzZXMuSU5BQ1RJVkVdOiBOZWFyYnlEZWdlbi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5BSU1JTkddOiBOZWFyYnlEZWdlbi5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLldBUk5JTkddOiBOZWFyYnlEZWdlbi5TdGFnZXMuV0FSTklORyxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpIHtcclxuXHRcdGlmICh0aGlzLmF0dGFja1BoYXNlLnNlcXVlbnRpYWxUaWNrKCkpXHJcblx0XHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYXBwbHkobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UuZ2V0UGxheWVyKCkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDaGFtcGlvbjtcclxuIiwiY29uc3QgTGl2aW5nRW50aXR5ID0gcmVxdWlyZSgnLi4vTGl2aW5nRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi4vbW9kdWxlL01vZHVsZU1hbmFnZXInKTtcbmNvbnN0IHtDb2xvcnMsIFBvc2l0aW9uc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgQmFyQyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyQycpO1xuY29uc3QgQmFyID0gcmVxdWlyZSgnLi4vLi4vcGFpbnRlci9CYXInKTtcblxuY2xhc3MgTW9uc3RlciBleHRlbmRzIExpdmluZ0VudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIGhlYWx0aCkge1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGhlYWx0aCwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5IT1NUSUxFX1VOSVQpO1xuXHRcdHRoaXMubW9kdWxlTWFuYWdlciA9IG5ldyBNb2R1bGVNYW5hZ2VyKCk7XG5cdH1cblxuXHR1cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpIHtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHN1cGVyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSk7XG5cdFx0cGFpbnRlci5hZGQoQmFyQy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnkgLSB0aGlzLmhlaWdodCwgLjEsIC4wMSwgdGhpcy5oZWFsdGguZ2V0UmF0aW8oKSxcblx0XHRcdENvbG9ycy5MSUZFLmdldFNoYWRlKENvbG9ycy5CQVJfU0hBRElORyksIENvbG9ycy5MSUZFLmdldCgpLCBDb2xvcnMuTElGRS5nZXQoKSkpO1xuXHR9XG5cblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChuZXcgQmFyKFxuXHRcdFx0UG9zaXRpb25zLk1BUkdJTixcblx0XHRcdFBvc2l0aW9ucy5NQVJHSU4sXG5cdFx0XHQxIC0gUG9zaXRpb25zLk1BUkdJTiAqIDIsXG5cdFx0XHRQb3NpdGlvbnMuQkFSX0hFSUdIVCxcblx0XHRcdHRoaXMuaGVhbHRoLmdldFJhdGlvKCksXG5cdFx0XHRDb2xvcnMuTElGRS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpLFxuXHRcdFx0Q29sb3JzLkxJRkUuZ2V0KCksXG5cdFx0XHRDb2xvcnMuTElGRS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpKSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb25zdGVyO1xuIiwiY2xhc3MgTW9uc3Rlcktub3dsZWRnZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHR9XG5cblx0c2V0UGxheWVyKHBsYXllcikge1xuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHR9XG5cblx0Z2V0UGxheWVyKHBsYXllcikge1xuXHRcdHJldHVybiB0aGlzLnBsYXllcjtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnN0ZXJLbm93bGVkZ2U7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgUmVjdDFEb3RzU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL1JlY3QxRG90c1NoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9QZXJpb2QnKTtcclxuY29uc3QgUm90YXRlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL1JvdGF0ZScpO1xyXG5jb25zdCBBaW0gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvQWltJyk7XHJcbmNvbnN0IFN0YXRpY0xhc2VyID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL1N0YXRpY0xhc2VyJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBBaW1pbmdMYXNlclR1cnJldCBleHRlbmRzIE1vbnN0ZXIge1xyXG5cdGNvbnN0cnVjdG9yKHgsIHkpIHtcclxuXHRcdHN1cGVyKHgsIHksIC4wOSwgLjA5LCAxLjYpO1xyXG5cdFx0dGhpcy5zZXRHcmFwaGljcyhuZXcgUmVjdDFEb3RzU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgQ29sb3JzLkVudGl0eS5NT05TVEVSLmdldCgpKSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgcGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0cGVyaW9kLmNvbmZpZyg1MCwgNzAsIDgwLCAxKTtcclxuXHRcdHBlcmlvZC5wZXJpb2RzLnNldFJhbmRvbVRpY2soKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUocGVyaW9kLCB7W1BoYXNlcy5PTkVdOiBQZXJpb2QuU3RhZ2VzLkxPT1B9KTtcclxuXHJcblx0XHRsZXQgcm90YXRlID0gbmV3IFJvdGF0ZSgpO1xyXG5cdFx0cm90YXRlLmNvbmZpZyh0aGlzLCAwLCAwLCB0cnVlKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUocm90YXRlLCB7XHJcblx0XHRcdDA6IFJvdGF0ZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IFJvdGF0ZS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQyOiBSb3RhdGUuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBSb3RhdGUuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGFpbS5jb25maWcodGhpcywgMCk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGFpbSwge1xyXG5cdFx0XHQwOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBzdGF0aWNMYXNlciA9IG5ldyBTdGF0aWNMYXNlcigpO1xyXG5cdFx0c3RhdGljTGFzZXIuY29uZmlnKHRoaXMsIC4wMDUsIC41LCBhaW0sIDUwLCAuMDA1KTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoc3RhdGljTGFzZXIsIHtcclxuXHRcdFx0MDogU3RhdGljTGFzZXIuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBTdGF0aWNMYXNlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IFN0YXRpY0xhc2VyLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHQzOiBTdGF0aWNMYXNlci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZSkge1xyXG5cdFx0aWYgKHRoaXMuYXR0YWNrUGhhc2Uuc2VxdWVudGlhbFRpY2soKSlcclxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZS5nZXRQbGF5ZXIoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFpbWluZ0xhc2VyVHVycmV0O1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgRG91YmxlSG9yaXpEaWFtb25kU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL0RvdWJsZUhvcml6RGlhbW9uZFNoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IHtQSX0gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBEaXN0YW5jZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9EaXN0YW5jZScpO1xyXG5jb25zdCBBaW0gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvQWltJyk7XHJcbmNvbnN0IENoYXNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0NoYXNlJyk7XHJcbmNvbnN0IENvb2xkb3duID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0Nvb2xkb3duJyk7XHJcbmNvbnN0IEFyZWFEZWdlbkxheWVyID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0FyZWFEZWdlbkxheWVyJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBCb21iTGF5ZXIgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDQsIC4wNCwgMS4yKTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IERvdWJsZUhvcml6RGlhbW9uZFNoaXAodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5NT05TVEVSLmdldCgpfSkpO1xyXG5cclxuXHRcdHRoaXMuYXR0YWNrUGhhc2UgPSBuZXcgUGhhc2UoMCk7XHJcblxyXG5cdFx0bGV0IGRpc3RhbmNlID0gbmV3IERpc3RhbmNlKCk7XHJcblx0XHRkaXN0YW5jZS5jb25maWcodGhpcywgLjEsIDEpO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZShkaXN0YW5jZSwge1tQaGFzZXMuT05FXTogRGlzdGFuY2UuU3RhZ2VzLkFDVElWRX0pO1xyXG5cclxuXHRcdGxldCBhaW0gPSBuZXcgQWltKCk7XHJcblx0XHRhaW0uY29uZmlnKHRoaXMsIFBJIC8gODAsIDgwLCAuMik7XHJcblx0XHRkaXN0YW5jZS5hZGRNb2R1bGUoYWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuUkVWRVJTRSxcclxuXHRcdFx0MTogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgY2hhc2UgPSBuZXcgQ2hhc2UoKTtcclxuXHRcdGNoYXNlLmNvbmZpZyh0aGlzLCAuMDAzLCBhaW0pO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKGNoYXNlLCB7XHJcblx0XHRcdDA6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjb29sZG93biA9IG5ldyBDb29sZG93bigpO1xyXG5cdFx0Y29vbGRvd24uY29uZmlnKDgwKTtcclxuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShjb29sZG93biwge1xyXG5cdFx0XHQwOiBDb29sZG93bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBDb29sZG93bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQyOiBDb29sZG93bi5TdGFnZXMuQ09PTERPV04sXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgYXJlYURlZ2VuID0gbmV3IEFyZWFEZWdlbkxheWVyKCk7XHJcblx0XHRhcmVhRGVnZW4uY29uZmlnKHRoaXMsIC4xLCAyMDAsIC4wMDMpO1xyXG5cdFx0Y29vbGRvd24uYWRkTW9kdWxlKGFyZWFEZWdlbiwge1xyXG5cdFx0XHRbQ29vbGRvd24uUGhhc2VzLlVOVFJJR0dFUkVEXTogQXJlYURlZ2VuTGF5ZXIuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRbQ29vbGRvd24uUGhhc2VzLlRSSUdHRVJFRF06IEFyZWFEZWdlbkxheWVyLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XHJcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxyXG5cdFx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLmdldFBsYXllcigpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQm9tYkxheWVyO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgSGV4YWdvblNoaXAgPSByZXF1aXJlKCcuLi8uLi8uLi9ncmFwaGljcy9IZXhhZ29uU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3Qge1BJfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0Rpc3RhbmNlJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9QZXJpb2QnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0FpbScpO1xyXG5jb25zdCBDaGFzZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9DaGFzZScpO1xyXG5jb25zdCBEYXNoID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0Rhc2gnKTtcclxuY29uc3QgVHJpZ2dlciA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9UcmlnZ2VyJyk7XHJcbmNvbnN0IE5lYXJieURlZ2VuID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL05lYXJieURlZ2VuJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBEYXNoQ2hhc2VyIGV4dGVuZHMgTW9uc3RlciB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSkge1xyXG5cdFx0c3VwZXIoeCwgeSwgLjA2LCAuMDYsIDEuMik7XHJcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBIZXhhZ29uU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgZGlzdGFuY2UgPSBuZXcgRGlzdGFuY2UoKTtcclxuXHRcdGRpc3RhbmNlLmNvbmZpZyh0aGlzLCAuOCwgMSk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKGRpc3RhbmNlLCB7W1BoYXNlcy5PTkVdOiBEaXN0YW5jZS5TdGFnZXMuQUNUSVZFfSk7XHJcblxyXG5cdFx0bGV0IHBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdHBlcmlvZC5jb25maWcoMTI1LCAzNSwgMTUsIDIwLCAxKTtcclxuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShwZXJpb2QsIHtcclxuXHRcdFx0MDogUGVyaW9kLlN0YWdlcy5MT09QLFxyXG5cdFx0XHQxOiBQZXJpb2QuU3RhZ2VzLlBMQVksXHJcblx0XHRcdDI6IFBlcmlvZC5TdGFnZXMuUExBWSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBhaW0gPSBuZXcgQWltKCk7XHJcblx0XHRhaW0uY29uZmlnKHRoaXMsIFBJIC8gODAsIDgwLCAuMik7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGFpbSwge1xyXG5cdFx0XHQwOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MTogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0NDogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgY2hhc2UgPSBuZXcgQ2hhc2UoKTtcclxuXHRcdGNoYXNlLmNvbmZpZyh0aGlzLCAuMDAyLCBhaW0pO1xyXG5cdFx0cGVyaW9kLmFkZE1vZHVsZShjaGFzZSwge1xyXG5cdFx0XHQwOiBDaGFzZS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQ0OiBDaGFzZS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGRhc2ggPSBuZXcgRGFzaCgpO1xyXG5cdFx0ZGFzaC5jb25maWcodGhpcywgLjI1LCAyMCk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGRhc2gsIHtcclxuXHRcdFx0MDogRGFzaC5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IERhc2guU3RhZ2VzLkFJTUlORyxcclxuXHRcdFx0MjogRGFzaC5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0MzogRGFzaC5TdGFnZXMuREFTSElORyxcclxuXHRcdFx0NDogRGFzaC5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgdHJpZ2dlckRhc2hFbmQgPSBuZXcgVHJpZ2dlcigpO1xyXG5cdFx0dHJpZ2dlckRhc2hFbmQuY29uZmlnKDEpO1xyXG5cdFx0ZGFzaC5hZGRNb2R1bGUodHJpZ2dlckRhc2hFbmQsIHtcclxuXHRcdFx0W0Rhc2guUGhhc2VzLklOQUNUSVZFXTogVHJpZ2dlci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHRbRGFzaC5QaGFzZXMuQUlNSU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5XQVJOSU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5EQVNISU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgbmVhcmJ5RGVnZW4gPSBuZXcgTmVhcmJ5RGVnZW4oKTtcclxuXHRcdG5lYXJieURlZ2VuLmNvbmZpZyhkYXNoLnRhcmdldCwgLjE1LCAuMDYpO1xyXG5cdFx0dHJpZ2dlckRhc2hFbmQuYWRkTW9kdWxlKG5lYXJieURlZ2VuLCB7XHJcblx0XHRcdFtUcmlnZ2VyLlBoYXNlcy5VTlRSSUdHRVJFRF06IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W1RyaWdnZXIuUGhhc2VzLlRSSUdHRVJFRF06IE5lYXJieURlZ2VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHRcdGRhc2guYWRkTW9kdWxlKG5lYXJieURlZ2VuLCB7XHJcblx0XHRcdFtEYXNoLlBoYXNlcy5JTkFDVElWRV06IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLkFJTUlOR106IE5lYXJieURlZ2VuLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHRbRGFzaC5QaGFzZXMuV0FSTklOR106IE5lYXJieURlZ2VuLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZSkge1xyXG5cdFx0aWYgKHRoaXMuYXR0YWNrUGhhc2Uuc2VxdWVudGlhbFRpY2soKSlcclxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZS5nZXRQbGF5ZXIoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERhc2hDaGFzZXI7XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vbnN0ZXIgPSByZXF1aXJlKCcuLi8uL01vbnN0ZXInKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBEaWFtb25kU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL0RpYW1vbmRTaGlwJyk7XHJcbmNvbnN0IFBoYXNlID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9QaGFzZScpO1xyXG5jb25zdCB7UEl9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuY29uc3QgRGlzdGFuY2UgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvRGlzdGFuY2UnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0FpbScpO1xyXG5jb25zdCBQYXR0ZXJuZWRQZXJpb2QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvUGF0dGVybmVkUGVyaW9kJyk7XHJcbmNvbnN0IENoYXNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0NoYXNlJyk7XHJcbmNvbnN0IE5lYXJieURlZ2VuID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL05lYXJieURlZ2VuJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBFeHBsb2RpbmdUaWNrIGV4dGVuZHMgTW9uc3RlciB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSkge1xyXG5cdFx0c3VwZXIoeCwgeSwgLjA0LCAuMDQsIC42KTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IERpYW1vbmRTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKX0pKTtcclxuXHJcblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xyXG5cclxuXHRcdGxldCBkaXN0YW5jZSA9IG5ldyBEaXN0YW5jZSgpO1xyXG5cdFx0ZGlzdGFuY2UuY29uZmlnKHRoaXMsIC4xLCAxKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUoZGlzdGFuY2UsIHtbUGhhc2VzLk9ORV06IERpc3RhbmNlLlN0YWdlcy5BQ1RJVkV9KTtcclxuXHJcblx0XHRsZXQgcGF0dGVybmVkUGVyaW9kID0gbmV3IFBhdHRlcm5lZFBlcmlvZCgpO1xyXG5cdFx0cGF0dGVybmVkUGVyaW9kLmNvbmZpZyhbMCwgNjAsIDYwLCA2MF0sIFtbMF0sIFsxLCAyLCAzXSwgWzNdXSwgW2ZhbHNlLCBmYWxzZSwgdHJ1ZV0pO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKHBhdHRlcm5lZFBlcmlvZCwge1xyXG5cdFx0XHQwOiBbUGF0dGVybmVkUGVyaW9kLlByaW1hcnlTdGFnZXMuTE9PUCwgMV0sXHJcblx0XHRcdDE6IFtQYXR0ZXJuZWRQZXJpb2QuUHJpbWFyeVN0YWdlcy5QTEFZLCAyXSxcclxuXHRcdFx0MjogW1BhdHRlcm5lZFBlcmlvZC5QcmltYXJ5U3RhZ2VzLlNUT1BdLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGFpbS5jb25maWcodGhpcywgUEkgLyAyMCwgNTAsIC4xKTtcclxuXHRcdHBhdHRlcm5lZFBlcmlvZC5hZGRNb2R1bGUoYWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlID0gbmV3IENoYXNlKCk7XHJcblx0XHRjaGFzZS5jb25maWcodGhpcywgLjAwMywgYWltKTtcclxuXHRcdHBhdHRlcm5lZFBlcmlvZC5hZGRNb2R1bGUoY2hhc2UsIHtcclxuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBkZWdlbiA9IG5ldyBOZWFyYnlEZWdlbigpO1xyXG5cdFx0ZGVnZW4uY29uZmlnKHRoaXMsIC4xNSwgLjAwMyk7XHJcblx0XHRwYXR0ZXJuZWRQZXJpb2QuYWRkTW9kdWxlKGRlZ2VuLCB7XHJcblx0XHRcdDA6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdDI6IE5lYXJieURlZ2VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDM6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGRpc3RhbmNlLm1vZHVsZXNTZXRTdGFnZSgwKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpIHtcclxuXHRcdGlmICh0aGlzLmF0dGFja1BoYXNlLnNlcXVlbnRpYWxUaWNrKCkpXHJcblx0XHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYXBwbHkobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UuZ2V0UGxheWVyKCkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBFeHBsb2RpbmdUaWNrO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNZWNoYW5pY2FsQm9zc0Vhcmx5ID0gcmVxdWlyZSgnLi9NZWNoYW5pY2FsQm9zc0Vhcmx5Jyk7XHJcbmNvbnN0IFBoYXNlID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9QaGFzZScpO1xyXG5jb25zdCBQZXJpb2QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvUGVyaW9kJyk7XHJcbmNvbnN0IFBvc2l0aW9uID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL1Bvc2l0aW9uJyk7XHJcbmNvbnN0IEFyZWFEZWdlbkxheWVyID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0FyZWFEZWdlbkxheWVyJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBNZWNoYW5pY2FsQm9zcyBleHRlbmRzIE1lY2hhbmljYWxCb3NzRWFybHkge1xyXG5cdGFkZE1vZHVsZXMoKSB7XHJcblx0XHRzdXBlci5hZGRNb2R1bGVzKCk7XHJcblx0XHR0aGlzLmFkZFN1cnJvdW5kRGVnZW5Nb2R1bGUoKTtcclxuXHRcdHRoaXMuYWRkQ2hhc2VEZWdlbk1vZHVsZSgpO1xyXG5cdH1cclxuXHJcblx0YWRkU3Vycm91bmREZWdlbk1vZHVsZSgpIHtcclxuXHRcdGxldCBzdXJyb3VuZERlZ2VuUGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0c3Vycm91bmREZWdlblBlcmlvZC5jb25maWcoMSwgMzgsIDEpO1xyXG5cdFx0dGhpcy5wZXJpb2QuYWRkTW9kdWxlKHN1cnJvdW5kRGVnZW5QZXJpb2QsIHtcclxuXHRcdFx0MDogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQxOiBQZXJpb2QuU3RhZ2VzLkxPT1AsXHJcblx0XHRcdDI6IFBlcmlvZC5TdGFnZXMuU1RPUCxcclxuXHRcdFx0MzogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxOyBpKyspIHtcclxuXHRcdFx0bGV0IHN1cnJvdW5kRGVnZW5UYXJnZXQgPSBuZXcgUG9zaXRpb24oKTtcclxuXHRcdFx0c3Vycm91bmREZWdlblRhcmdldC5jb25maWcodGhpcywgLjIsIC41KTtcclxuXHRcdFx0c3Vycm91bmREZWdlblBlcmlvZC5hZGRNb2R1bGUoc3Vycm91bmREZWdlblRhcmdldCwge1xyXG5cdFx0XHRcdDA6IFBvc2l0aW9uLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdFx0MTogUG9zaXRpb24uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDI6IFBvc2l0aW9uLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsZXQgc3Vycm91bmREZWdlbiA9IG5ldyBBcmVhRGVnZW5MYXllcigpO1xyXG5cdFx0XHRzdXJyb3VuZERlZ2VuLmNvbmZpZyhzdXJyb3VuZERlZ2VuVGFyZ2V0LCAuMSwgMjAwLCAuMDAyKTtcclxuXHRcdFx0c3Vycm91bmREZWdlblBlcmlvZC5hZGRNb2R1bGUoc3Vycm91bmREZWdlbiwge1xyXG5cdFx0XHRcdDA6IEFyZWFEZWdlbkxheWVyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0XHQyOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGFkZENoYXNlRGVnZW5Nb2R1bGUoKSB7XHJcblx0XHRsZXQgY2hhc2VEZWdlblBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdGNoYXNlRGVnZW5QZXJpb2QuY29uZmlnKDEsIDM4LCAxKTtcclxuXHRcdHRoaXMucGVyaW9kLmFkZE1vZHVsZShjaGFzZURlZ2VuUGVyaW9kLCB7XHJcblx0XHRcdDA6IFBlcmlvZC5TdGFnZXMuU1RPUCxcclxuXHRcdFx0MTogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQyOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHRcdDM6IFBlcmlvZC5TdGFnZXMuTE9PUCxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZURlZ2VuVGFyZ2V0ID0gbmV3IFBvc2l0aW9uKCk7XHJcblx0XHRjaGFzZURlZ2VuVGFyZ2V0LmNvbmZpZygpO1xyXG5cdFx0Y2hhc2VEZWdlblBlcmlvZC5hZGRNb2R1bGUoY2hhc2VEZWdlblRhcmdldCwge1xyXG5cdFx0XHQwOiBQb3NpdGlvbi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBQb3NpdGlvbi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IFBvc2l0aW9uLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZURlZ2VuID0gbmV3IEFyZWFEZWdlbkxheWVyKCk7XHJcblx0XHRjaGFzZURlZ2VuLmNvbmZpZyhjaGFzZURlZ2VuVGFyZ2V0LCAuMSwgMjAwLCAuMDAyKTtcclxuXHRcdGNoYXNlRGVnZW5QZXJpb2QuYWRkTW9kdWxlKGNoYXNlRGVnZW4sIHtcclxuXHRcdFx0MDogQXJlYURlZ2VuTGF5ZXIuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0MjogQXJlYURlZ2VuTGF5ZXIuU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNZWNoYW5pY2FsQm9zcztcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9uc3RlciA9IHJlcXVpcmUoJy4uLy4vTW9uc3RlcicpO1xyXG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFJlY3QxRG90c1NoaXAgPSByZXF1aXJlKCcuLi8uLi8uLi9ncmFwaGljcy9SZWN0MURvdHNTaGlwJyk7XHJcbmNvbnN0IFBoYXNlID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9QaGFzZScpO1xyXG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1ZlY3RvcicpO1xyXG5jb25zdCBEaXN0YW5jZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9EaXN0YW5jZScpO1xyXG5jb25zdCBQZXJpb2QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvUGVyaW9kJyk7XHJcbmNvbnN0IE5lYXJieURlZ2VuID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL05lYXJieURlZ2VuJyk7XHJcbmNvbnN0IEFpbSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9BaW0nKTtcclxuY29uc3QgU2hvdGd1biA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9TaG90Z3VuJyk7XHJcbmNvbnN0IFN0YXRpY0xhc2VyID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL1N0YXRpY0xhc2VyJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBNZWNoYW5pY2FsQm9zc0Vhcmx5IGV4dGVuZHMgTW9uc3RlciB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSkge1xyXG5cdFx0c3VwZXIoeCwgeSwgLjIsIC4yLCAyMik7XHJcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSZWN0MURvdHNTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCkpKTtcclxuXHJcblx0XHR0aGlzLmFkZE1vZHVsZXMoKTtcclxuXHJcblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHR9XHJcblxyXG5cdGFkZE1vZHVsZXMoKSB7XHJcblx0XHR0aGlzLmFkZFBhcmVudHNNb2R1bGUoKTtcclxuXHRcdHRoaXMuYWRkTmVhcmJ5RGVnZW5Nb2R1bGUoKTtcclxuXHRcdHRoaXMuYWRkRmFyQXdheVNob3RndW5Nb2R1bGUoKTtcclxuXHRcdHRoaXMuYWRkTGFzZXJNb2R1bGUoKTtcclxuXHRcdHRoaXMuYWRkU2hvdGd1bkZpcmVNb2R1bGUoKTtcclxuXHR9XHJcblxyXG5cdGFkZFBhcmVudHNNb2R1bGUoKSB7XHJcblx0XHR0aGlzLmRpc3RhbmNlID0gbmV3IERpc3RhbmNlKCk7XHJcblx0XHR0aGlzLmRpc3RhbmNlLmNvbmZpZyh0aGlzLCAuMjUsIC43NSk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHRoaXMuZGlzdGFuY2UsIHtbUGhhc2VzLk9ORV06IERpc3RhbmNlLlN0YWdlcy5BQ1RJVkV9KTtcclxuXHJcblx0XHR0aGlzLnBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdHRoaXMucGVyaW9kLmNvbmZpZygxMDAsIDIwMCwgMTAwLCAyMDApO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZSh0aGlzLnBlcmlvZCwge1tQaGFzZXMuT05FXTogUGVyaW9kLlN0YWdlcy5MT09QfSk7XHJcblx0fVxyXG5cclxuXHRhZGROZWFyYnlEZWdlbk1vZHVsZSgpIHtcclxuXHRcdGxldCBuZWFyYnlEZWdlblBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdG5lYXJieURlZ2VuUGVyaW9kLmNvbmZpZyg1MCwgMTUwLCAxKTtcclxuXHRcdG5lYXJieURlZ2VuUGVyaW9kLnBlcmlvZHMuc2V0UGhhc2UoMik7XHJcblx0XHR0aGlzLmRpc3RhbmNlLmFkZE1vZHVsZShuZWFyYnlEZWdlblBlcmlvZCwge1xyXG5cdFx0XHQwOiBQZXJpb2QuU3RhZ2VzLkxPT1AsXHJcblx0XHRcdDE6IFBlcmlvZC5TdGFnZXMuUExBWSxcclxuXHRcdFx0MjogUGVyaW9kLlN0YWdlcy5QTEFZLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IG5lYXJieURlZ2VuID0gbmV3IE5lYXJieURlZ2VuKCk7XHJcblx0XHRuZWFyYnlEZWdlbi5jb25maWcodGhpcywgLjUsIC4wMDIpO1xyXG5cdFx0bmVhcmJ5RGVnZW5QZXJpb2QuYWRkTW9kdWxlKG5lYXJieURlZ2VuLCB7XHJcblx0XHRcdDA6IE5lYXJieURlZ2VuLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHQxOiBOZWFyYnlEZWdlbi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQyOiBOZWFyYnlEZWdlbi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0YWRkRmFyQXdheVNob3RndW5Nb2R1bGUoKSB7XHJcblx0XHRsZXQgZmFyQXdheVNob3RndW5BaW0gPSBuZXcgQWltKCk7XHJcblx0XHRmYXJBd2F5U2hvdGd1bkFpbS5jb25maWcodGhpcywgMCk7XHJcblx0XHR0aGlzLmRpc3RhbmNlLmFkZE1vZHVsZShmYXJBd2F5U2hvdGd1bkFpbSwge1xyXG5cdFx0XHQwOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQyOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBmYXJBd2F5U2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XHJcblx0XHRmYXJBd2F5U2hvdGd1bi5jb25maWcodGhpcywgLjEsIDEsIC4wMSwgMCwgMjAwLCAuMDEsIGZhckF3YXlTaG90Z3VuQWltLCB0cnVlKTtcclxuXHRcdHRoaXMuZGlzdGFuY2UuYWRkTW9kdWxlKGZhckF3YXlTaG90Z3VuLCB7XHJcblx0XHRcdDA6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogU2hvdGd1bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRhZGRMYXNlck1vZHVsZSgpIHtcclxuXHRcdGxldCBsYXNlclBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdGxhc2VyUGVyaW9kLmNvbmZpZygxLCAzOCwgMSk7XHJcblx0XHR0aGlzLnBlcmlvZC5hZGRNb2R1bGUobGFzZXJQZXJpb2QsIHtcclxuXHRcdFx0MDogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQxOiBQZXJpb2QuU3RhZ2VzLkxPT1AsXHJcblx0XHRcdDI6IFBlcmlvZC5TdGFnZXMuU1RPUCxcclxuXHRcdFx0MzogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAzOyBpKyspIHtcclxuXHRcdFx0bGV0IGxhc2VyQWltID0gbmV3IEFpbSgpO1xyXG5cdFx0XHRsYXNlckFpbS5jb25maWcodGhpcywgMCwgMSwgLjEpO1xyXG5cdFx0XHRsYXNlclBlcmlvZC5hZGRNb2R1bGUobGFzZXJBaW0sIHtcclxuXHRcdFx0XHQwOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0XHQxOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0bGV0IHN0YXRpY0xhc2VyID0gbmV3IFN0YXRpY0xhc2VyKCk7XHJcblx0XHRcdHN0YXRpY0xhc2VyLmNvbmZpZyh0aGlzLCAuMDA1LCAuNSwgbGFzZXJBaW0sIDQwLCAuMDAyLCAuMDEpO1xyXG5cdFx0XHRsYXNlclBlcmlvZC5hZGRNb2R1bGUoc3RhdGljTGFzZXIsIHtcclxuXHRcdFx0XHQwOiBTdGF0aWNMYXNlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MTogU3RhdGljTGFzZXIuU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdFx0MjogU3RhdGljTGFzZXIuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblxyXG5cdH1cclxuXHJcblx0YWRkU2hvdGd1bkZpcmVNb2R1bGUoKSB7XHJcblx0XHRbWy0xLCAtMV0sIFstMSwgMV0sIFsxLCAtMV0sIFsxLCAxXV0uZm9yRWFjaCh4eSA9PiB7XHJcblx0XHRcdGxldCBzaG90Z3VuQWltID0gbmV3IEFpbSgpO1xyXG5cdFx0XHRzaG90Z3VuQWltLmNvbmZpZyh0aGlzLCAwLCAwLCAwLCBuZXcgVmVjdG9yKC4uLnh5KSk7XHJcblx0XHRcdHRoaXMucGVyaW9kLmFkZE1vZHVsZShzaG90Z3VuQWltLCB7XHJcblx0XHRcdFx0MDogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MzogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsZXQgc2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XHJcblx0XHRcdHNob3RndW4uY29uZmlnKHRoaXMsIC4xLCAxLCAuMDA1LCAuMDAyLCAxMDAsIC4wNCwgc2hvdGd1bkFpbSwgdHJ1ZSk7XHJcblx0XHRcdHRoaXMucGVyaW9kLmFkZE1vZHVsZShzaG90Z3VuLCB7XHJcblx0XHRcdFx0MDogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MTogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MjogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MzogU2hvdGd1bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XHJcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxyXG5cdFx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLmdldFBsYXllcigpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWVjaGFuaWNhbEJvc3NFYXJseTtcclxuXHJcbi8vIHRvZG8gW2hpZ2hdIHJvdGF0aW9uXHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vbnN0ZXIgPSByZXF1aXJlKCcuLi8uL01vbnN0ZXInKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBTcGxpdERpYW1vbmRTaGlwID0gcmVxdWlyZSgnLi4vLi4vLi4vZ3JhcGhpY3MvU3BsaXREaWFtb25kU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3Qge1BJfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL0Rpc3RhbmNlJyk7XHJcbmNvbnN0IEFpbSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9BaW0nKTtcclxuY29uc3QgQ2hhc2UgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvQ2hhc2UnKTtcclxuY29uc3QgQ29vbGRvd24gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvQ29vbGRvd24nKTtcclxuY29uc3QgU2hvdGd1biA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZS9TaG90Z3VuJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBTbmlwZXJUaWNrIGV4dGVuZHMgTW9uc3RlciB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSkge1xyXG5cdFx0c3VwZXIoeCwgeSwgLjA0LCAuMDQsIC42KTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFNwbGl0RGlhbW9uZFNoaXAodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5NT05TVEVSLmdldCgpfSkpO1xyXG5cclxuXHRcdHRoaXMuYXR0YWNrUGhhc2UgPSBuZXcgUGhhc2UoMCk7XHJcblxyXG5cdFx0bGV0IGRpc3RhbmNlID0gbmV3IERpc3RhbmNlKCk7XHJcblx0XHRkaXN0YW5jZS5jb25maWcodGhpcywgLjUsIC43LCAxKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUoZGlzdGFuY2UsIHtbUGhhc2VzLk9ORV06IERpc3RhbmNlLlN0YWdlcy5BQ1RJVkV9KTtcclxuXHJcblx0XHRsZXQgY2hhc2VBaW0gPSBuZXcgQWltKCk7XHJcblx0XHRjaGFzZUFpbS5jb25maWcodGhpcywgUEkgLyAyMCwgMTAwLCAxKTtcclxuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShjaGFzZUFpbSwge1xyXG5cdFx0XHQwOiBBaW0uU3RhZ2VzLlJFVkVSU0UsXHJcblx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQzOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlID0gbmV3IENoYXNlKCk7XHJcblx0XHRjaGFzZS5jb25maWcodGhpcywgLjAwMywgY2hhc2VBaW0pO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKGNoYXNlLCB7XHJcblx0XHRcdDA6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MzogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNvb2xkb3duID0gbmV3IENvb2xkb3duKCk7XHJcblx0XHRjb29sZG93bi5jb25maWcoMjAwKTtcclxuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShjb29sZG93biwge1xyXG5cdFx0XHQwOiBDb29sZG93bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBDb29sZG93bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQyOiBDb29sZG93bi5TdGFnZXMuQ09PTERPV04sXHJcblx0XHRcdDM6IENvb2xkb3duLlN0YWdlcy5DT09MRE9XTixcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBzaG90Z3VuQWltID0gbmV3IEFpbSgpO1xyXG5cdFx0c2hvdGd1bkFpbS5jb25maWcodGhpcyk7XHJcblx0XHRjb29sZG93bi5hZGRNb2R1bGUoc2hvdGd1bkFpbSwge1xyXG5cdFx0XHRbQ29vbGRvd24uUGhhc2VzLlVOVFJJR0dFUkVEXTogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVFJJR0dFUkVEXTogU2hvdGd1bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IHNob3RndW4gPSBuZXcgU2hvdGd1bigpO1xyXG5cdFx0c2hvdGd1bi5jb25maWcodGhpcywgMSwgMSwgLjAxLCAuMDAxLCAxMDAsIC4wNiwgc2hvdGd1bkFpbSk7XHJcblx0XHRjb29sZG93bi5hZGRNb2R1bGUoc2hvdGd1biwge1xyXG5cdFx0XHRbQ29vbGRvd24uUGhhc2VzLlVOVFJJR0dFUkVEXTogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVFJJR0dFUkVEXTogU2hvdGd1bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0ZGlzdGFuY2UubW9kdWxlc1NldFN0YWdlKDApO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHR9XHJcblxyXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZSkge1xyXG5cdFx0aWYgKHRoaXMuYXR0YWNrUGhhc2Uuc2VxdWVudGlhbFRpY2soKSlcclxuXHRcdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hcHBseShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZS5nZXRQbGF5ZXIoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNuaXBlclRpY2s7XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vbnN0ZXIgPSByZXF1aXJlKCcuLi8uL01vbnN0ZXInKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBSZWN0NERvdHNTaGlwID0gcmVxdWlyZSgnLi4vLi4vLi4vZ3JhcGhpY3MvUmVjdDREb3RzU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9WZWN0b3InKTtcclxuY29uc3QgUGVyaW9kID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlL1BlcmlvZCcpO1xyXG5jb25zdCBBaW0gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvQWltJyk7XHJcbmNvbnN0IFNob3RndW4gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGUvU2hvdGd1bicpO1xyXG5cclxuY29uc3QgUGhhc2VzID0gbWFrZUVudW0oJ09ORScpO1xyXG5cclxuY2xhc3MgU3RhdGljNERpclR1cnJldCBleHRlbmRzIE1vbnN0ZXIge1xyXG5cdGNvbnN0cnVjdG9yKHgsIHkpIHtcclxuXHRcdHN1cGVyKHgsIHksIC4wOSwgLjA5LCAxLjYpO1xyXG5cdFx0dGhpcy5zZXRHcmFwaGljcyhuZXcgUmVjdDREb3RzU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgQ29sb3JzLkVudGl0eS5NT05TVEVSLmdldCgpKSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgcGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0cGVyaW9kLmNvbmZpZygxMjAsIDgwKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUocGVyaW9kLCB7W1BoYXNlcy5PTkVdOiBQZXJpb2QuU3RhZ2VzLkxPT1B9KTtcclxuXHJcblx0XHRbXHJcblx0XHRcdHt4OiAxLCB5OiAwfSxcclxuXHRcdFx0e3g6IDAsIHk6IDF9LFxyXG5cdFx0XHR7eDogLTEsIHk6IDB9LFxyXG5cdFx0XHR7eDogMCwgeTogLTF9LFxyXG5cdFx0XS5mb3JFYWNoKGRpciA9PiB7XHJcblx0XHRcdGxldCBhaW0gPSBuZXcgQWltKCk7XHJcblx0XHRcdGFpbS5jb25maWcodGhpcywgMCwgMCwgMCwgVmVjdG9yLmZyb21PYmooZGlyKSk7XHJcblx0XHRcdHBlcmlvZC5hZGRNb2R1bGUoYWltLCB7XHJcblx0XHRcdFx0MDogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGxldCBzaG90Z3VuID0gbmV3IFNob3RndW4oKTtcclxuXHRcdFx0c2hvdGd1bi5jb25maWcodGhpcywgLjA1LCAxLCAuMDAzLCAuMDAwMSwgMTAwLCAuMDQsIGFpbSwgdHJ1ZSk7XHJcblx0XHRcdHBlcmlvZC5hZGRNb2R1bGUoc2hvdGd1biwge1xyXG5cdFx0XHRcdDA6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDE6IFNob3RndW4uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XHJcblx0XHRpZiAodGhpcy5hdHRhY2tQaGFzZS5zZXF1ZW50aWFsVGljaygpKVxyXG5cdFx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLmdldFBsYXllcigpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RhdGljNERpclR1cnJldDtcclxuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgRGFtYWdlRHVzdCBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHNpemUsIHZ4LCB2eSwgdGltZSkge1xuXHRcdHN1cGVyKHgsIHksIHNpemUsIHNpemUsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSUdOT1JFKTtcblx0XHR0aGlzLnZ4ID0gdng7XG5cdFx0dGhpcy52eSA9IHZ5O1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0Y29uc3QgRlJJQ1RJT04gPSAuOTg7XG5cblx0XHRpZiAoIXRoaXMudGltZS0tKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR0aGlzLm1vdmUodGhpcy52eCwgdGhpcy52eSk7XG5cblx0XHR0aGlzLnZ4ICo9IEZSSUNUSU9OO1xuXHRcdHRoaXMudnkgKj0gRlJJQ1RJT047XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuREFNQUdFX0RVU1QuZ2V0KCl9KSk7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhbWFnZUR1c3Q7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBEdXN0IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgc2l6ZSwgdngsIHZ5LCB0aW1lKSB7XG5cdFx0c3VwZXIoeCwgeSwgc2l6ZSwgc2l6ZSwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5JR05PUkUpO1xuXHRcdHRoaXMudnggPSB2eDtcblx0XHR0aGlzLnZ5ID0gdnk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHRjb25zdCBGUklDVElPTiA9IC45ODtcblxuXHRcdGlmICghdGhpcy50aW1lLS0pXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdHRoaXMubW92ZSh0aGlzLnZ4LCB0aGlzLnZ5KTtcblxuXHRcdHRoaXMudnggKj0gRlJJQ1RJT047XG5cdFx0dGhpcy52eSAqPSBGUklDVElPTjtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtjb2xvcjogQ29sb3JzLkVudGl0eS5EVVNULmdldCgpfSkpO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEdXN0O1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFBPSU5UUyA9IFtcblx0WzAsIDFdLFxuXHRbMSwgMF0sXG5cdFswLCAtMV0sXG5cdFstMSwgMF1dO1xuXG5jbGFzcyBEaWFtb25kU2hpcCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMgPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIFBPSU5UUywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGlhbW9uZFNoaXA7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gW1xuXHRbMCwgMV0sXG5cdFsxLCAwXSxcblx0WzAsIC0xXSxcblx0Wy0xLCAwXV07XG5cbmNsYXNzIERvdWJsZUhvcml6RGlhbW9uZCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMgPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoWFkoLXdpZHRoLzIsIDAsIHdpZHRoLCBoZWlnaHQsIFBPSU5UUywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHRcdHRoaXMuYWRkUGF0aFhZKHdpZHRoLzIsIDAsIHdpZHRoLCBoZWlnaHQsIFBPSU5UUywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRG91YmxlSG9yaXpEaWFtb25kO1xuIiwiY29uc3QgUGF0aENyZWF0b3IgPSByZXF1aXJlKCcuL1BhdGhDcmVhdG9yJyk7XG5cbmNsYXNzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5wYXRoQ3JlYXRvcnMgPSBbXTtcblx0fVxuXG5cdC8vIHRvZG8gW21lZGl1bV0gZGVwcmVjYXRlZCBhbmQgcmVwbGFjZSB3aXRoIGFkZFBhdGhYWVxuXHRhZGRQYXRoKHdpZHRoLCBoZWlnaHQsIHBvaW50cywgY2xvc2VkLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdGxldCBwYXRoQ3JlYXRvciA9IG5ldyBQYXRoQ3JlYXRvcigpO1xuXHRcdHBhdGhDcmVhdG9yLnNldEZpbGwoZmlsbCk7XG5cdFx0cGF0aENyZWF0b3Iuc2V0Q29sb3IoY29sb3IpO1xuXHRcdHBhdGhDcmVhdG9yLnNldFRoaWNrbmVzcyh0aGlja25lc3MpO1xuXHRcdHBhdGhDcmVhdG9yLnNldFNjYWxlKHdpZHRoLCBoZWlnaHQsIEdyYXBoaWNzLmNhbGN1bGF0ZVNjYWxlKHBvaW50cykpO1xuXHRcdHBhdGhDcmVhdG9yLnNldENsb3NlZChjbG9zZWQpO1xuXHRcdHBvaW50cy5mb3JFYWNoKHBvaW50ID0+IHBhdGhDcmVhdG9yLm1vdmVUbyguLi5wb2ludCkpO1xuXHRcdHRoaXMucGF0aENyZWF0b3JzLnB1c2gocGF0aENyZWF0b3IpO1xuXHR9XG5cblx0YWRkUGF0aFhZKHgsIHksIHdpZHRoLCBoZWlnaHQsIHBvaW50cywgY2xvc2VkLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdGxldCBwYXRoQ3JlYXRvciA9IG5ldyBQYXRoQ3JlYXRvcigpO1xuXHRcdHBhdGhDcmVhdG9yLnNldEZpbGwoZmlsbCk7XG5cdFx0cGF0aENyZWF0b3Iuc2V0Q29sb3IoY29sb3IpO1xuXHRcdHBhdGhDcmVhdG9yLnNldFRoaWNrbmVzcyh0aGlja25lc3MpO1xuXHRcdHBhdGhDcmVhdG9yLnNldFRyYW5zbGF0aW9uKHgsIHkpO1xuXHRcdHBhdGhDcmVhdG9yLnNldFNjYWxlKHdpZHRoLCBoZWlnaHQsIEdyYXBoaWNzLmNhbGN1bGF0ZVNjYWxlKHBvaW50cykpO1xuXHRcdHBhdGhDcmVhdG9yLnNldENsb3NlZChjbG9zZWQpO1xuXHRcdHBvaW50cy5mb3JFYWNoKHBvaW50ID0+IHBhdGhDcmVhdG9yLm1vdmVUbyguLi5wb2ludCkpO1xuXHRcdHRoaXMucGF0aENyZWF0b3JzLnB1c2gocGF0aENyZWF0b3IpO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhLCB4LCB5LCBtb3ZlRGlyZWN0aW9uKSB7XG5cdFx0dGhpcy5wYXRoQ3JlYXRvcnMuZm9yRWFjaChwYXRoQ3JlYXRvciA9PiB7XG5cdFx0XHRwYXRoQ3JlYXRvci5zZXRDYW1lcmEoY2FtZXJhKTtcblx0XHRcdHBhdGhDcmVhdG9yLnNldENlbnRlcih4LCB5KTtcblx0XHRcdHBhdGhDcmVhdG9yLnNldEZvcndhcmQobW92ZURpcmVjdGlvbi54LCBtb3ZlRGlyZWN0aW9uLnkpO1xuXHRcdFx0cGFpbnRlci5hZGQocGF0aENyZWF0b3IuY3JlYXRlKCkpO1xuXHRcdH0pO1xuXHR9XG5cblx0c3RhdGljIGNhbGN1bGF0ZVNjYWxlKHBvaW50cykge1xuXHRcdGxldCB4cyA9IHBvaW50cy5tYXAoKFt4XSkgPT4geCk7XG5cdFx0bGV0IHlzID0gcG9pbnRzLm1hcCgoW18sIHldKSA9PiB5KTtcblx0XHRsZXQgeGQgPSBNYXRoLm1heCguLi54cykgLSBNYXRoLm1pbiguLi54cyk7XG5cdFx0bGV0IHlkID0gTWF0aC5tYXgoLi4ueXMpIC0gTWF0aC5taW4oLi4ueXMpO1xuXHRcdHJldHVybiAyIC8gKHhkICsgeWQpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGhpY3M7XG4iLCJjb25zdCBQYXRoQ3JlYXRvciA9IHJlcXVpcmUoJy4vUGF0aENyZWF0b3InKTtcbmNvbnN0IEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcycpO1xuXG5jb25zdCBQT0lOVFMgPSBQYXRoQ3JlYXRvci5jcmVhdGVDaXJjbGVQb2ludHMoKTtcblxuY2xhc3MgSGV4YWdvblNoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBQT0lOVFMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhleGFnb25TaGlwO1xuIiwiY29uc3QgUGF0aCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUGF0aCcpO1xuY29uc3Qge1BJMiwgdGhldGFUb1ZlY3Rvcn0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuXG5jbGFzcyBQYXRoQ3JlYXRvciB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuc3ggPSAuMTsgLy8gdG9kbyBbbG93XSBuZWNlc3Nhcnkgb3IgZ3VhcmFudGVlZCB0byBiZSBvdmVyd3JpdHRlbj9cblx0XHR0aGlzLnN5ID0gLjE7XG5cdFx0dGhpcy50eCA9IDA7XG5cdFx0dGhpcy50eSA9IDA7XG5cdFx0dGhpcy5meCA9IDA7XG5cdFx0dGhpcy5meSA9IC0xO1xuXHRcdHRoaXMuY3ggPSAwO1xuXHRcdHRoaXMuY3kgPSAwO1xuXG5cdFx0dGhpcy54eXMgPSBbXTtcblx0XHR0aGlzLnggPSAwO1xuXHRcdHRoaXMueSA9IDA7XG5cdH1cblxuXHRzZXRDYW1lcmEoY2FtZXJhKSB7XG5cdFx0dGhpcy5jYW1lcmEgPSBjYW1lcmE7XG5cdH1cblxuXHRzZXRGaWxsKGZpbGwpIHtcblx0XHR0aGlzLmZpbGwgPSBmaWxsO1xuXHR9XG5cblx0c2V0Q29sb3IoY29sb3IpIHtcblx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdH1cblxuXHRzZXRUaGlja25lc3ModGhpY2tuZXNzKSB7XG5cdFx0dGhpcy50aGlja25lc3MgPSB0aGlja25lc3M7XG5cdH1cblxuXHRzZXRTY2FsZSh4LCB5LCBzKSB7XG5cdFx0dGhpcy5zeCA9IHggKiBzO1xuXHRcdHRoaXMuc3kgPSB5ICogcztcblx0XHR0aGlzLnNzID0gKHggKyB5KSAvIDIgKiBzO1xuXHR9XG5cblx0c2V0VHJhbnNsYXRpb24oeCwgeSkge1xuXHRcdHRoaXMudHggPSB4O1xuXHRcdHRoaXMudHkgPSB5O1xuXHR9XG5cblx0c2V0Rm9yd2FyZCh4LCB5KSB7XG5cdFx0dGhpcy5meCA9IHg7XG5cdFx0dGhpcy5meSA9IHk7XG5cdH1cblxuXHRzZXRDZW50ZXIoeCwgeSkge1xuXHRcdHRoaXMuY3ggPSB4O1xuXHRcdHRoaXMuY3kgPSB5O1xuXHR9XG5cblx0c2V0Q2xvc2VkKGNsb3NlZCkge1xuXHRcdHRoaXMuY2xvc2VkID0gY2xvc2VkO1xuXHR9XG5cblx0bW92ZVRvKHgsIHksIHNraXBBZGQpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0c2tpcEFkZCB8fCB0aGlzLmFkZCgpO1xuXHR9XG5cblx0bW92ZUJ5KHgsIHksIHNraXBBZGQpIHtcblx0XHR0aGlzLnggKz0geDtcblx0XHR0aGlzLnkgKz0geTtcblx0XHRza2lwQWRkIHx8IHRoaXMuYWRkKCk7XG5cdH1cblxuXHRhZGQoKSB7XG5cdFx0dGhpcy54eXMucHVzaChbdGhpcy54LCB0aGlzLnldKTtcblx0fVxuXG5cdGNyZWF0ZSgpIHtcblx0XHRsZXQgcGF0aFBvaW50cyA9IHRoaXMuY29tcHV0ZVBhdGhQb2ludHMoKTtcblx0XHRsZXQgdGhpY2tuZXNzID0gdGhpcy5jb21wdXRlVGhpY2tuZXNzKCk7XG5cdFx0cmV0dXJuIG5ldyBQYXRoKHBhdGhQb2ludHMsIHRoaXMuY2xvc2VkLCB7ZmlsbDogdGhpcy5maWxsLCBjb2xvcjogdGhpcy5jb2xvciwgdGhpY2tuZXNzfSk7XG5cdH1cblxuXHRjb21wdXRlUGF0aFBvaW50cygpIHtcblx0XHQvLyBbMCwgMV0gbWFwcyB0byBjZW50ZXIgKyBmb3J3YXJkXG5cdFx0bGV0IHBhdGhQb2ludHMgPSBbXTtcblx0XHR0aGlzLnh5cy5mb3JFYWNoKChbeCwgeV0pID0+IHtcblx0XHRcdHggPSB4ICogdGhpcy5zeCArIHRoaXMudHg7XG5cdFx0XHR5ID0geSAqIHRoaXMuc3kgKyB0aGlzLnR5O1xuXHRcdFx0bGV0IHBhdGhYID0gdGhpcy5jeCArIHRoaXMuZnggKiB5IC0gdGhpcy5meSAqIHg7XG5cdFx0XHRsZXQgcGF0aFkgPSB0aGlzLmN5ICsgdGhpcy5meSAqIHkgKyB0aGlzLmZ4ICogeDtcblx0XHRcdHBhdGhQb2ludHMucHVzaChbdGhpcy5jYW1lcmEueHQocGF0aFgpLCB0aGlzLmNhbWVyYS55dChwYXRoWSldKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gcGF0aFBvaW50cztcblx0fVxuXG5cdGNvbXB1dGVUaGlja25lc3MoKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2FtZXJhLnN0KHRoaXMudGhpY2tuZXNzICogdGhpcy5zcyk7XG5cdH1cblxuXHQvLyB0b2RvIFttZWRpdW1dIHVzZSB0aGlzIGV2ZXJ5d2hlcmUgd2hlcmUgdXNlZnVsXG5cdHN0YXRpYyBjcmVhdGVDaXJjbGVQb2ludHMociA9IDEsIG4gPSA2LCB4ID0gMCwgeSA9IDApIHtcblx0XHRsZXQgcG9pbnRzID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcblx0XHRcdGxldCB0aGV0YSA9IGkgKiBQSTIgLyBuO1xuXHRcdFx0bGV0IHZlY3RvciA9IHRoZXRhVG9WZWN0b3IodGhldGEsIHIpO1xuXHRcdFx0cG9pbnRzLnB1c2goW3ggKyB2ZWN0b3JbMF0sIHkgKyB2ZWN0b3JbMV1dKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBvaW50cztcblx0fTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXRoQ3JlYXRvcjtcbiIsImNvbnN0IFBhdGhDcmVhdG9yID0gcmVxdWlyZSgnLi9QYXRoQ3JlYXRvcicpO1xuY29uc3QgQ29sb3IgPSByZXF1aXJlKCcuLi91dGlsL0NvbG9yJyk7XG5jb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUkVDVF9QT0lOVFMgPSBbXG5cdFswLCAxXSxcblx0WzEsIDBdLFxuXHRbMCwgLTFdLFxuXHRbLTEsIDBdXTtcblxuY29uc3QgRE9UX1NDQUxFID0gLjI7XG5jb25zdCBET1RfUE9TID0gLjI7XG5jb25zdCBET1RfUE9JTlRTID0gUGF0aENyZWF0b3IuY3JlYXRlQ2lyY2xlUG9pbnRzKDEsIDYsIDAsIDApO1xuY29uc3QgRE9UX0NPTE9SID0gQ29sb3IuZnJvbTEoMSwgMSwgMSkuZ2V0KCk7XG5cbmNsYXNzIFJlY3Q0RG90c1NoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGNvbG9yKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUkVDVF9QT0lOVFMsIHRydWUsIHtmaWxsOiB0cnVlLCBjb2xvcn0pO1xuXHRcdHRoaXMuYWRkUGF0aFhZKFxuXHRcdFx0MCwgaGVpZ2h0ICogRE9UX1BPUyxcblx0XHRcdHdpZHRoICogRE9UX1NDQUxFLCBoZWlnaHQgKiBET1RfU0NBTEUsXG5cdFx0XHRET1RfUE9JTlRTLCB0cnVlLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IERPVF9DT0xPUn0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUmVjdDREb3RzU2hpcDtcbiIsImNvbnN0IFBhdGhDcmVhdG9yID0gcmVxdWlyZSgnLi9QYXRoQ3JlYXRvcicpO1xuY29uc3QgQ29sb3IgPSByZXF1aXJlKCcuLi91dGlsL0NvbG9yJyk7XG5jb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUkVDVF9QT0lOVFMgPSBbXG5cdFswLCAxXSxcblx0WzEsIDBdLFxuXHRbMCwgLTFdLFxuXHRbLTEsIDBdXTtcblxuY29uc3QgRE9UX1NDQUxFID0gLjE1O1xuY29uc3QgRE9UX1BPUyA9IC4yNTtcbmNvbnN0IERPVF9QT0lOVFMgPSBQYXRoQ3JlYXRvci5jcmVhdGVDaXJjbGVQb2ludHMoMSwgNiwgMCwgMCk7XG5jb25zdCBET1RfQ09MT1IgPSBDb2xvci5mcm9tMSgxLCAxLCAxKS5nZXQoKTtcblxuY2xhc3MgUmVjdDREb3RzU2hpcCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgY29sb3IpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBSRUNUX1BPSU5UUywgdHJ1ZSwge2ZpbGw6IHRydWUsIGNvbG9yfSk7XG5cdFx0UkVDVF9QT0lOVFMuZm9yRWFjaCgoW3gsIHldKSA9PlxuXHRcdFx0dGhpcy5hZGRQYXRoWFkoXG5cdFx0XHRcdHggKiB3aWR0aCAqIERPVF9QT1MsIHkgKiBoZWlnaHQgKiBET1RfUE9TLFxuXHRcdFx0XHR3aWR0aCAqIERPVF9TQ0FMRSwgaGVpZ2h0ICogRE9UX1NDQUxFLFxuXHRcdFx0XHRET1RfUE9JTlRTLCB0cnVlLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IERPVF9DT0xPUn0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q0RG90c1NoaXA7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY2xhc3MgUmVjdEdyYXBoaWMgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdGxldCByZWN0ID0gW1xuXHRcdFx0Wy0xLCAtMV0sXG5cdFx0XHRbLTEsIDFdLFxuXHRcdFx0WzEsIDFdLFxuXHRcdFx0WzEsIC0xXV07XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIHJlY3QsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3RHcmFwaGljO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5jb25zdCB7UEkyLCB0aGV0YVRvVmVjdG9yLCByYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbi8vIG1pbiBtYWduaXR1ZGUgb2YgYWxsIHBvaW50cyB3aWxsIGJlIE1JTl9NQUdOSVRVREUgLyAoTUlOX01BR05JVFVERSArIDEpXG5jb25zdCBQT0lOVFMgPSA1LCBNSU5fTUFHTklUVURFID0gMTtcblxuY2xhc3MgUm9ja0dyYXBoaWMgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdGxldCBwb2ludHMgPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IFBPSU5UUzsgaSsrKVxuXHRcdFx0cG9pbnRzLnB1c2godGhldGFUb1ZlY3RvcihpICogUEkyIC8gUE9JTlRTLCByYW5kKCkgKyBNSU5fTUFHTklUVURFKSk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIHBvaW50cywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm9ja0dyYXBoaWM7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgRElBTU9ORF9QT0lOVFMgPSBbXG5cdFswLCAxLjVdLFxuXHRbMSwgMF0sXG5cdFswLCAtMS41XSxcblx0Wy0xLCAwXV07XG5cbi8vIGNvbnN0IFNQTElUX1BPSU5UUyA9IFtcbi8vIFx0Wy0xLCAwXSxcbi8vIFx0WzEsIDBdXTtcblxuY2xhc3MgU3BsaXREaWFtb25kU2hpcCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMgPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIERJQU1PTkRfUE9JTlRTLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdFx0Ly8gdGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIFNQTElUX1BPSU5UUywgZmFsc2UsIHtjb2xvcjogJ3JnYigyNTUsMCwyNTUpJ30pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3BsaXREaWFtb25kU2hpcDtcbiIsImNvbnN0IFBhdGhDcmVhdG9yID0gcmVxdWlyZSgnLi9QYXRoQ3JlYXRvcicpO1xuY29uc3QgQ29sb3IgPSByZXF1aXJlKCcuLi91dGlsL0NvbG9yJyk7XG5jb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gUGF0aENyZWF0b3IuY3JlYXRlQ2lyY2xlUG9pbnRzKCk7XG5jb25zdCBDT0xPUiA9IENvbG9yLmZyb20yNTUoMjQwLCAyMDAsIDIzMCkuZ2V0KCk7XG5cbmNsYXNzIFRlc3RTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB0cnVlLFxuXHRcdFx0e2ZpbGw6IHRydWUsIGNvbG9yOiBDT0xPUn0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVGVzdFNoaXA7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gW1xuXHRbMCwgM10sIC8vIGZyb250XG5cdFsyLCAtMV0sIC8vIHJpZ2h0XG5cdFswLCAtM10sIC8vIGJhY2tcblx0Wy0yLCAtMV1dOyAvLyBsZWZ0XG5cbmNsYXNzIFZTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBncmFwaGljT3B0aW9ucyA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWU2hpcDtcbiIsImNvbnN0IEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcycpO1xuXG5jb25zdCBQT0lOVFMgPSBbXG5cdFsxLCAuNV0sXG5cdFszLCAyXSxcblx0WzIsIC0yXSxcblx0WzAsIC0xXSxcblx0Wy0yLCAtMl0sXG5cdFstMywgMl0sXG5cdFstMSwgLjVdXTtcblxuY2xhc3MgV1NoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBQT0lOVFMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdTaGlwO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcbmNvbnN0IEludGVyZmFjZSA9IHJlcXVpcmUoJy4vSW50ZXJmYWNlJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0Jyk7XG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XG5cbmNvbnN0IFN0YXRlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdBQ1RJVkUnLCAnSE9WRVInKTtcblxuY2xhc3MgQnV0dG9uIGV4dGVuZHMgSW50ZXJmYWNlIHtcblx0Y29uc3RydWN0b3IodGV4dCkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5JTkFDVElWRTtcblx0XHR0aGlzLnRleHQgPSB0ZXh0O1xuXHR9XG5cblx0dXBkYXRlKGNvbnRyb2xsZXIpIHtcblx0XHRsZXQge3gsIHl9ID0gY29udHJvbGxlci5nZXRSYXdNb3VzZSgpO1xuXG5cdFx0aWYgKCF0aGlzLmJvdW5kcy5pbnNpZGUoeCwgeSkpXG5cdFx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLklOQUNUSVZFO1xuXHRcdGVsc2Vcblx0XHRcdHRoaXMuc3RhdGUgPSBjb250cm9sbGVyLmdldE1vdXNlU3RhdGUoKS5hY3RpdmUgPyBTdGF0ZXMuQUNUSVZFIDogU3RhdGVzLkhPVkVSO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlcikge1xuXHRcdGxldCBjb2xvciA9IFtDb2xvcnMuSW50ZXJmYWNlLklOQUNUSVZFLCBDb2xvcnMuSW50ZXJmYWNlLkFDVElWRSwgQ29sb3JzLkludGVyZmFjZS5IT1ZFUl1bdGhpcy5zdGF0ZV0uZ2V0KCk7XG5cblx0XHRwYWludGVyLmFkZChuZXcgUmVjdCh0aGlzLmxlZnQsIHRoaXMudG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yfSkpO1xuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KHRoaXMubGVmdCwgdGhpcy50b3AsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KSk7XG5cdFx0cGFpbnRlci5hZGQobmV3IFRleHQodGhpcy5sZWZ0ICsgdGhpcy53aWR0aCAvIDIsIHRoaXMudG9wICsgdGhpcy5oZWlnaHQgLyAyLCB0aGlzLnRleHQpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1dHRvbjtcbiIsImNvbnN0IEJvdW5kcyA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9Cb3VuZHMnKTtcblxuY2xhc3MgSW50ZXJmYWNlIHtcblx0c2V0UG9zaXRpb24obGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy5sZWZ0ID0gbGVmdDtcblx0XHR0aGlzLnRvcCA9IHRvcDtcblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cdFx0dGhpcy5ib3VuZHMgPSBuZXcgQm91bmRzKGxlZnQsIHRvcCwgbGVmdCArIHdpZHRoLCB0b3AgKyBoZWlnaHQpO1xuXHR9XG5cblx0dXBkYXRlKGNvbnRyb2xsZXIpIHtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyZmFjZTtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vdXRpbC9FbnVtJyk7XG5cbmNvbnN0IERpcmVjdGlvbnMgPSBtYWtlRW51bSgnTEVGVCcsICdUT1AnLCAnUklHSFQnLCAnQk9UVE9NJyk7XG5cbmNsYXNzIEJvdW5kcyB7XG5cdGNvbnN0cnVjdG9yKC4uLmxlZnRUb3BSaWdodEJvdHRvbSkge1xuXHRcdGlmIChsZWZ0VG9wUmlnaHRCb3R0b20pXG5cdFx0XHR0aGlzLnNldCguLi5sZWZ0VG9wUmlnaHRCb3R0b20pO1xuXHR9XG5cblx0c2V0KGxlZnQsIHRvcCwgcmlnaHQgPSBsZWZ0LCBib3R0b20gPSB0b3ApIHtcblx0XHR0aGlzLnZhbHVlcyA9IFtdO1xuXHRcdHRoaXMudmFsdWVzW0RpcmVjdGlvbnMuTEVGVF0gPSBsZWZ0O1xuXHRcdHRoaXMudmFsdWVzW0RpcmVjdGlvbnMuVE9QXSA9IHRvcDtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLlJJR0hUXSA9IHJpZ2h0O1xuXHRcdHRoaXMudmFsdWVzW0RpcmVjdGlvbnMuQk9UVE9NXSA9IGJvdHRvbTtcblx0fVxuXG5cdGdldChkaXJlY3Rpb24pIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZXNbZGlyZWN0aW9uXTtcblx0fVxuXG5cdGdldE9wcG9zaXRlKGRpcmVjdGlvbikge1xuXHRcdHJldHVybiB0aGlzLmdldChCb3VuZHMub3Bwb3NpdGVEaXJlY3Rpb24oZGlyZWN0aW9uKSk7XG5cdH1cblxuXHRpbnRlcnNlY3RzKGJvdW5kcykge1xuXHRcdGNvbnN0IHNpZ25zID0gWy0xLCAtMSwgMSwgMV07XG5cdFx0cmV0dXJuIHRoaXMudmFsdWVzLmV2ZXJ5KCh2YWx1ZSwgZGlyZWN0aW9uKSA9PlxuXHRcdFx0dmFsdWUgKiBzaWduc1tkaXJlY3Rpb25dID4gYm91bmRzLmdldE9wcG9zaXRlKGRpcmVjdGlvbikgKiBzaWduc1tkaXJlY3Rpb25dKTtcblx0fVxuXG5cdGluc2lkZSh4LCB5KXtcblx0XHRyZXR1cm4gdGhpcy5pbnRlcnNlY3RzKG5ldyBCb3VuZHMoeCwgeSwgeCwgeSkpO1xuXHR9XG5cblx0c3RhdGljIG9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbikge1xuXHRcdHN3aXRjaCAoZGlyZWN0aW9uKSB7XG5cdFx0XHRjYXNlIERpcmVjdGlvbnMuTEVGVDpcblx0XHRcdFx0cmV0dXJuIERpcmVjdGlvbnMuUklHSFQ7XG5cdFx0XHRjYXNlIERpcmVjdGlvbnMuVE9QOlxuXHRcdFx0XHRyZXR1cm4gRGlyZWN0aW9ucy5CT1RUT007XG5cdFx0XHRjYXNlIERpcmVjdGlvbnMuUklHSFQ6XG5cdFx0XHRcdHJldHVybiBEaXJlY3Rpb25zLkxFRlQ7XG5cdFx0XHRjYXNlIERpcmVjdGlvbnMuQk9UVE9NOlxuXHRcdFx0XHRyZXR1cm4gRGlyZWN0aW9ucy5UT1A7XG5cdFx0fVxuXHR9XG59XG5cbkJvdW5kcy5EaXJlY3Rpb25zID0gRGlyZWN0aW9ucztcblxubW9kdWxlLmV4cG9ydHMgPSBCb3VuZHM7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBMaW5rZWRMaXN0ID0gcmVxdWlyZSgnLi4vdXRpbC9MaW5rZWRMaXN0Jyk7XHJcbmNvbnN0IHtFUFNJTE9OLCBtYXhXaGljaCwgc2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IEJvdW5kcyA9IHJlcXVpcmUoJy4vQm91bmRzJyk7XHJcblxyXG5jb25zdCBMYXllcnMgPSBtYWtlRW51bShcclxuXHQnUEFTU0lWRScsICAgICAgICAgICAgICAvLyBpbnRlcnNlY3RzIHdpdGggZXZlcnl0aGluZ1xyXG5cdCdGUklFTkRMWV9QUk9KRUNUSUxFJywgIC8vIGludGVyc2VjdHMgd2l0aCBob3N0aWxlIHVuaXRzIGFuZCBwYXNzaXZlc1xyXG5cdCdGUklFTkRMWV9VTklUJywgICAgICAgIC8vIGludGVyc2VjdHMgd2l0aCBob3N0aWxlIHVuaXRzLCBob3N0aWxlIHByb2plY3RpbGVzLCBhbmQgcGFzc2l2ZXNcclxuXHQnSE9TVElMRV9QUk9KRUNUSUxFJywgICAvLyBpbnRlcnNlY3RzIHdpdGggZnJpZW5kbHkgdW5pdHMgYW5kIHBhc3NpdmVzXHJcblx0J0hPU1RJTEVfVU5JVCcsICAgICAgICAgLy8gaW50ZXJzZWN0cyB3aXRoIGZyaWVuZGx5IHVuaXRzLCBob3N0aWxlIHVuaXRzLCBmcmllbmRseSBwcm9qZWN0aWxlcywgYW5kIHBhc3NpdmVzXHJcblx0J0lHTk9SRScpOyAgICAgICAgICAgICAgLy8gaW50ZXJzZWN0cyB3aXRoIG5vdGhpbmdcclxuXHJcbmNvbnN0IENvbGxpc2lvblR5cGVzID0gbWFrZUVudW0oXHJcblx0J09GRicsIC8vIHVudXNlZCwgdW5zZXQvdW5kZWZpbmVkIGluc3RlYWRcclxuXHQnT04nLFxyXG5cdCdUUkFDS19PTkxZJywgLy8gdHJhY2tzIGNvbGxpc2lvbnMgYnV0IGRvZXMgbm90IHByZXZlbnQgbW92ZW1lbnRcclxuKTtcclxuXHJcbmNsYXNzIEludGVyc2VjdGlvbkZpbmRlciB7XHJcblx0Y29uc3RydWN0b3IoKSB7XHJcblx0XHR0aGlzLmNvbGxpc2lvbnMgPSBPYmplY3Qua2V5cyhMYXllcnMpLm1hcCgoKSA9PiBbXSk7XHJcblx0XHR0aGlzLmJvdW5kc0dyb3VwcyA9IE9iamVjdC5rZXlzKExheWVycykubWFwKCgpID0+IG5ldyBMaW5rZWRMaXN0KCkpO1xyXG5cclxuXHRcdHRoaXMuaW5pdENvbGxpc2lvbnMoKTtcclxuXHR9XHJcblxyXG5cdGluaXRDb2xsaXNpb25zKCkge1xyXG5cdFx0Ly8gdG9kbyBbbWVkXSBhbGxvdyB1bml0cyB0byBtb3ZlIHRocm91Z2ggcHJvamVjdGlsZXMsIHdoaWxlIHRha2luZyBkYW1hZ2VcclxuXHRcdC8vIHBhc3NpdmVzIGludGVyc2VjdCB3aXRoIGV2ZXJ5dGhpbmdcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuRlJJRU5ETFlfVU5JVCk7XHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuUEFTU0lWRSwgTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUpO1xyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLlBBU1NJVkUsIExheWVycy5GUklFTkRMWV9VTklUKTtcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFKTtcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuSE9TVElMRV9VTklUKTtcclxuXHJcblx0XHQvLyBQcm9qZWN0aWxlcyBpbnRlcnNlY3Qgd2l0aCBvcHBvc2luZyB1bml0cyB1bi1zeW1tZXRyaWNhbGx5XHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSwgTGF5ZXJzLkhPU1RJTEVfVU5JVCwgZmFsc2UpO1xyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkhPU1RJTEVfUFJPSkVDVElMRSwgTGF5ZXJzLkZSSUVORExZX1VOSVQsIGZhbHNlKTtcclxuXHJcblx0XHQvLyBmcmllbmRseSB1bml0cyBpbnRlcnNlY3Qgd2l0aCBob3N0aWxlIHVuaXRzXHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuRlJJRU5ETFlfVU5JVCwgTGF5ZXJzLkhPU1RJTEVfVU5JVCk7XHJcblxyXG5cdFx0Ly8gaG9zdGlsZSB1bml0cyBpbnRlcnNlY3RzIHdpdGggaG9zdGlsZSB1bml0c1xyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkhPU1RJTEVfVU5JVCwgTGF5ZXJzLkhPU1RJTEVfVU5JVCk7XHJcblx0fVxyXG5cclxuXHRhZGRDb2xsaXNpb24obGF5ZXIxLCBsYXllcjIsIHN5bW1ldHJpYyA9IHRydWUpIHtcclxuXHRcdHRoaXMuY29sbGlzaW9uc1tsYXllcjFdW2xheWVyMl0gPSBDb2xsaXNpb25UeXBlcy5PTjtcclxuXHRcdHRoaXMuY29sbGlzaW9uc1tsYXllcjJdW2xheWVyMV0gPSBzeW1tZXRyaWMgPyBDb2xsaXNpb25UeXBlcy5PTiA6IENvbGxpc2lvblR5cGVzLlRSQUNLX09OTFk7XHJcblx0fVxyXG5cclxuXHRhZGRCb3VuZHMobGF5ZXIsIGJvdW5kcywgcmVmZXJlbmNlKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5ib3VuZHNHcm91cHNbbGF5ZXJdLmFkZCh7Ym91bmRzLCByZWZlcmVuY2V9KVxyXG5cdH1cclxuXHJcblx0cmVtb3ZlQm91bmRzKGxheWVyLCBpdGVtKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5ib3VuZHNHcm91cHNbbGF5ZXJdLnJlbW92ZShpdGVtKTtcclxuXHR9XHJcblxyXG5cdGhhc0ludGVyc2VjdGlvbihzZWFyY2hMYXllciwgYm91bmRzKSB7XHJcblx0XHRsZXQgaXRlbSA9IHRoaXMuYm91bmRzR3JvdXBzW3NlYXJjaExheWVyXVxyXG5cdFx0XHQuZmluZCgoe2JvdW5kczogaUJvdW5kc30pID0+IGlCb3VuZHMuaW50ZXJzZWN0cyhib3VuZHMpKTtcclxuXHRcdHJldHVybiBpdGVtICYmIGl0ZW0udmFsdWUucmVmZXJlbmNlO1xyXG5cdH1cclxuXHJcblx0aW50ZXJzZWN0aW9ucyhsYXllciwgYm91bmRzKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5jb2xsaXNpb25zW2xheWVyXS5mbGF0TWFwKChfLCBpTGF5ZXIpID0+XHJcblx0XHRcdHRoaXMuYm91bmRzR3JvdXBzW2lMYXllcl1cclxuXHRcdFx0XHQuZmlsdGVyKCh7Ym91bmRzOiBpQm91bmRzfSkgPT4gaUJvdW5kcy5pbnRlcnNlY3RzKGJvdW5kcykpXHJcblx0XHRcdFx0Lm1hcChpdGVtID0+IGl0ZW0udmFsdWUucmVmZXJlbmNlKSk7XHJcblx0fVxyXG5cclxuXHRjYW5Nb3ZlKGxheWVyLCBib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKSB7XHJcblx0XHQvLyBpZiBtYWduaXR1ZGUgaXMgLTEsIHRoZW4gPGR4LCBkeT4gaXMgbm90IG5lY2Vzc2FyaWx5IGEgdW5pdCB2ZWN0b3IsIGFuZCBpdHMgbWFnbml0dWRlIHNob3VsZCBiZSB1c2VkXHJcblx0XHRpZiAobWFnbml0dWRlID09PSAtMSlcclxuXHRcdFx0KHt4OiBkeCwgeTogZHksIHByZXZNYWduaXR1ZGU6IG1hZ25pdHVkZX0gPSBzZXRNYWduaXR1ZGUoZHgsIGR5KSk7XHJcblxyXG5cdFx0aWYgKCFkeCAmJiAhZHkgfHwgbWFnbml0dWRlIDw9IDApXHJcblx0XHRcdHJldHVybiB7eDogMCwgeTogMCwgcmVmZXJlbmNlOiBbXSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzOiBbXX07XHJcblxyXG5cdFx0bGV0IG1vdmVYID0gMCwgbW92ZVkgPSAwO1xyXG5cclxuXHRcdGxldCBob3Jpem9udGFsID0gZHggPD0gMCA/IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQgOiBCb3VuZHMuRGlyZWN0aW9ucy5SSUdIVDtcclxuXHRcdGxldCB2ZXJ0aWNhbCA9IGR5IDw9IDAgPyBCb3VuZHMuRGlyZWN0aW9ucy5UT1AgOiBCb3VuZHMuRGlyZWN0aW9ucy5CT1RUT007XHJcblxyXG5cdFx0bGV0IGludGVyc2VjdGlvblJlZmVyZW5jZSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzID0gW107XHJcblx0XHRpZiAoZHggJiYgZHkpIHtcclxuXHRcdFx0bGV0IHttb3ZlLCBzaWRlLCByZWZlcmVuY2V9ID0gdGhpcy5jaGVja01vdmVFbnRpdGllc0ludGVyc2VjdGlvbihsYXllciwgYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIHRyYWNrZWRPbmx5UmVmZXJlbmNlcyk7XHJcblxyXG5cdFx0XHRtb3ZlWCArPSBkeCAqIG1vdmU7XHJcblx0XHRcdG1vdmVZICs9IGR5ICogbW92ZTtcclxuXHRcdFx0bWFnbml0dWRlIC09IG1vdmU7XHJcblxyXG5cdFx0XHRpZiAoIXNpZGUgfHwgbm9TbGlkZSkge1xyXG5cdFx0XHRcdHRyYWNrZWRPbmx5UmVmZXJlbmNlcyA9IHRyYWNrZWRPbmx5UmVmZXJlbmNlcy5maWx0ZXIoKFtfLCBtb3ZlXSkgPT4gbW92ZSA8PSBtYWduaXR1ZGUpLm1hcCgoW3JlZmVyZW5jZV0pID0+IHJlZmVyZW5jZSk7XHJcblx0XHRcdFx0cmV0dXJuIHt4OiBtb3ZlWCwgeTogbW92ZVksIHJlZmVyZW5jZSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzfTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWRlID09PSAxKSB7XHJcblx0XHRcdFx0aG9yaXpvbnRhbCA9IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQ7XHJcblx0XHRcdFx0ZHggPSAwO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHZlcnRpY2FsID0gQm91bmRzLkRpcmVjdGlvbnMuVE9QO1xyXG5cdFx0XHRcdGR5ID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW50ZXJzZWN0aW9uUmVmZXJlbmNlID0gcmVmZXJlbmNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCB7bW92ZSwgcmVmZXJlbmNlfSA9IHRoaXMuY2hlY2tNb3ZlRW50aXRpZXNJbnRlcnNlY3Rpb24obGF5ZXIsIGJvdW5kcywgZHgsIGR5LCBtYWduaXR1ZGUsIGhvcml6b250YWwsIHZlcnRpY2FsLCB0cmFja2VkT25seVJlZmVyZW5jZXMpO1xyXG5cdFx0bW92ZVggKz0gZHggKiBtb3ZlO1xyXG5cdFx0bW92ZVkgKz0gZHkgKiBtb3ZlO1xyXG5cdFx0bWFnbml0dWRlIC09IG1vdmU7XHJcblx0XHR0cmFja2VkT25seVJlZmVyZW5jZXMgPSB0cmFja2VkT25seVJlZmVyZW5jZXMuZmlsdGVyKChbXywgbW92ZV0pID0+IG1vdmUgPD0gbWFnbml0dWRlKS5tYXAoKFtyZWZlcmVuY2VdKSA9PiByZWZlcmVuY2UpO1xyXG5cclxuXHRcdHJldHVybiB7eDogbW92ZVgsIHk6IG1vdmVZLCByZWZlcmVuY2U6IGludGVyc2VjdGlvblJlZmVyZW5jZSB8fCByZWZlcmVuY2UsIHRyYWNrZWRPbmx5UmVmZXJlbmNlc307XHJcblx0XHQvLyB0b2RvIFtsb3ddIHJldHVybiBsaXN0IG9mIGFsbCBpbnRlcnNlY3Rpb24gcmVmZXJlbmNlc1xyXG5cdH1cclxuXHJcblx0Ly8gbW92ZXMgYm91bmRzIHVudGlsIGludGVyc2VjdGluZyBvZiB0eXBlIE9OXHJcblx0Ly8gcmV0dXJucyBzaW1pbGFyIHRvIGNoZWNrTW92ZUVudGl0eUludGVyc2VjdGlvbiBpbiBhZGRpdGlvbiB0byByZWZlcmVuY2UsIHRoZSBjbG9zZXN0IE9OIGNvbGxpc2lvbiB0eXBlXHJcblx0Ly8gdHJhY2tPbmx5UmVmZXJlbmNlc1N1cGVyc2V0IGlzIGFuIG91dHB1dCBhcnJheSB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgdG8gZm9yIGFsbCBUUkFDS19PTkxZIGNvbGxpc2lvbnMgZW5jb3VudGVyZWRcclxuXHQvLyB0cmFja09ubHlSZWZlcmVuY2VzU3VwZXJzZXQgd2lsbCBiZSBwYXJ0aWFsbHkgZmlsdGVyZWQgYnkgZGlzdGFuY2UgPCByZWZlcmVuY2VcclxuXHRjaGVja01vdmVFbnRpdGllc0ludGVyc2VjdGlvbihsYXllciwgYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIHRyYWNrT25seVJlZmVyZW5jZXNTdXBlcnNldCkge1xyXG5cdFx0bGV0IHNpZGUsIHJlZmVyZW5jZTtcclxuXHJcblx0XHR0aGlzLmNvbGxpc2lvbnNbbGF5ZXJdLmZvckVhY2goKGNvbGxpc2lvblR5cGUsIGlMYXllcikgPT5cclxuXHRcdFx0dGhpcy5ib3VuZHNHcm91cHNbaUxheWVyXS5mb3JFYWNoKCh7Ym91bmRzOiBpQm91bmRzLCByZWZlcmVuY2U6IGlSZWZlcmVuY2V9KSA9PiB7XHJcblx0XHRcdFx0aWYgKGlCb3VuZHMgPT09IGJvdW5kcylcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRsZXQgaUludGVyc2VjdGlvbiA9IEludGVyc2VjdGlvbkZpbmRlci5jaGVja01vdmVFbnRpdHlJbnRlcnNlY3Rpb24oYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIGlCb3VuZHMpO1xyXG5cdFx0XHRcdGlmIChpSW50ZXJzZWN0aW9uKVxyXG5cdFx0XHRcdFx0aWYgKGNvbGxpc2lvblR5cGUgPT09IENvbGxpc2lvblR5cGVzLk9OKSB7XHJcblx0XHRcdFx0XHRcdCh7bW92ZTogbWFnbml0dWRlLCBzaWRlfSA9IGlJbnRlcnNlY3Rpb24pO1xyXG5cdFx0XHRcdFx0XHRyZWZlcmVuY2UgPSBpUmVmZXJlbmNlO1xyXG5cdFx0XHRcdFx0fSBlbHNlXHJcblx0XHRcdFx0XHRcdHRyYWNrT25seVJlZmVyZW5jZXNTdXBlcnNldC5wdXNoKFtpUmVmZXJlbmNlLCBpSW50ZXJzZWN0aW9uLm1vdmVdKVxyXG5cdFx0XHR9KSk7XHJcblxyXG5cdFx0cmV0dXJuIHttb3ZlOiBtYWduaXR1ZGUsIHNpZGUsIHJlZmVyZW5jZX07XHJcblx0fVxyXG5cclxuXHQvLyBjaGVja3MgZm9yIGludGVyc2VjdGlvbiBiZXR3ZWVuIGJvdW5kcyArIG1vdmVtZW50ICYgaWJvdW5kc1xyXG5cdC8vIHJldHVybnMgdW5kZWZpbmVkIGlmIG5vIGludGVyc2VjdGlvblxyXG5cdC8vIHJldHVybnMge21vdmU6IGhvdyBtdWNoIGNhbiBtb3ZlIHVudGlsIGludGVyc2VjdGlvbiwgc2lkZTogd2hpY2ggc2lkZSB0aGUgaW50ZXJzZWN0aW9uIG9jY3VycmVkICgwID0gbm9uZSwgMSA9IGhvcml6b250YWwsIDIgPSB2ZXJ0aWNhbCl9XHJcblx0c3RhdGljIGNoZWNrTW92ZUVudGl0eUludGVyc2VjdGlvbihib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBob3Jpem9udGFsLCB2ZXJ0aWNhbCwgaUJvdW5kcykge1xyXG5cdFx0bGV0IGhvcml6b250YWxEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YShob3Jpem9udGFsLCBkeCwgYm91bmRzLCBpQm91bmRzLCBmYWxzZSk7XHJcblx0XHRsZXQgdmVydGljYWxEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YSh2ZXJ0aWNhbCwgZHksIGJvdW5kcywgaUJvdW5kcywgZmFsc2UpO1xyXG5cclxuXHRcdGlmIChob3Jpem9udGFsRGVsdGEgPj0gbWFnbml0dWRlIHx8IHZlcnRpY2FsRGVsdGEgPj0gbWFnbml0dWRlIHx8IGhvcml6b250YWxEZWx0YSA8IDAgJiYgdmVydGljYWxEZWx0YSA8IDApXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgW21heERlbHRhLCB3aGljaERlbHRhXSA9IG1heFdoaWNoKGhvcml6b250YWxEZWx0YSwgdmVydGljYWxEZWx0YSk7XHJcblxyXG5cdFx0bGV0IGhvcml6b250YWxGYXJEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YShob3Jpem9udGFsLCBkeCwgYm91bmRzLCBpQm91bmRzLCB0cnVlKTtcclxuXHRcdGxldCB2ZXJ0aWNhbEZhckRlbHRhID0gSW50ZXJzZWN0aW9uRmluZGVyLmdldERlbHRhKHZlcnRpY2FsLCBkeSwgYm91bmRzLCBpQm91bmRzLCB0cnVlKTtcclxuXHJcblx0XHRpZiAobWF4RGVsdGEgPj0gMCAmJiBtYXhEZWx0YSA8IE1hdGgubWluKGhvcml6b250YWxGYXJEZWx0YSwgdmVydGljYWxGYXJEZWx0YSkpXHJcblx0XHRcdHJldHVybiB7bW92ZTogTWF0aC5tYXgobWF4RGVsdGEgLSBFUFNJTE9OLCAwKSwgc2lkZTogd2hpY2hEZWx0YSArIDF9O1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGdldERlbHRhKGRpcmVjdGlvbiwgZCwgYm91bmRzLCBpQm91bmRzLCBmYXIpIHtcclxuXHRcdGlmIChkKSB7XHJcblx0XHRcdGlmIChmYXIpXHJcblx0XHRcdFx0ZGlyZWN0aW9uID0gQm91bmRzLm9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbik7XHJcblx0XHRcdHJldHVybiAoaUJvdW5kcy5nZXRPcHBvc2l0ZShkaXJlY3Rpb24pIC0gYm91bmRzLmdldChkaXJlY3Rpb24pKSAvIGQ7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGlCb3VuZHMuZ2V0T3Bwb3NpdGUoZGlyZWN0aW9uKSA+IGJvdW5kcy5nZXQoZGlyZWN0aW9uKSAmJiBpQm91bmRzLmdldChkaXJlY3Rpb24pIDwgYm91bmRzLmdldE9wcG9zaXRlKGRpcmVjdGlvbikgXiBmYXJcclxuXHRcdFx0PyAwIDogSW5maW5pdHk7XHJcblx0fVxyXG59XHJcblxyXG5JbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzID0gTGF5ZXJzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcnNlY3Rpb25GaW5kZXI7XHJcblxyXG4vLyB0b2RvIFtsb3ddIHN1cHBvcnQgcmVjdGFuZ3VsYXIgbW9iaWxlIChyb3RhdGluZyllbnRpdGllc1xyXG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IEtleW1hcHBpbmcgPSByZXF1aXJlKCcuLi9jb250cm9sL0tleW1hcHBpbmcnKTtcbmNvbnN0IE1hcCA9IHJlcXVpcmUoJy4uL21hcC9NYXAnKTtcbmNvbnN0IFBsYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL1BsYXllcicpO1xuY29uc3QgTW9uc3Rlcktub3dsZWRnZSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL01vbnN0ZXJLbm93bGVkZ2UnKTtcbmNvbnN0IE1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL21hcC9NYXBHZW5lcmF0b3JBcmVuYScpO1xuY29uc3QgTWluaW1hcCA9IHJlcXVpcmUoJy4uL21hcC9NaW5pbWFwJyk7XG5jb25zdCBDYW1lcmEgPSByZXF1aXJlKCcuLi9jYW1lcmEvQ2FtZXJhJyk7XG5jb25zdCBTdGFyZmllbGQgPSByZXF1aXJlKCcuLi9zdGFyZmllbGQvU3RhcmZpZWxkJyk7XG5cbmNvbnN0IFVJID0gdHJ1ZTtcblxuY2xhc3MgR2FtZSBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlclNldCkge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpO1xuXHRcdHRoaXMubWFwID0gbmV3IE1hcCgpO1xuXHRcdHRoaXMucGxheWVyID0gbmV3IFBsYXllcigpO1xuXHRcdHRoaXMubW9uc3Rlcktub3dsZWRnZSA9IG5ldyBNb25zdGVyS25vd2xlZGdlKCk7XG5cdFx0dGhpcy5tb25zdGVyS25vd2xlZGdlLnNldFBsYXllcih0aGlzLnBsYXllcik7XG5cdFx0dGhpcy5tYXBHZW5lcmF0b3IgPSBuZXcgTWFwR2VuZXJhdG9yKHRoaXMubWFwLCB0aGlzLnBsYXllcik7XG5cdFx0dGhpcy5tYXBHZW5lcmF0b3IuZ2VuZXJhdGUoKTtcblx0XHR0aGlzLm1pbmltYXAgPSBuZXcgTWluaW1hcCh0aGlzLm1hcCk7XG5cdFx0dGhpcy5jYW1lcmEgPSBuZXcgQ2FtZXJhKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuXHRcdHRoaXMuc3RhcmZpZWxkID0gbmV3IFN0YXJmaWVsZCguLi50aGlzLm1hcC5nZXRTaXplKCkpO1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdHRoaXMucGFpbnQoKTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLnVwZGF0ZUNhbWVyYSgpO1xuXHRcdHRoaXMuY29udHJvbGxlci5pbnZlcnNlVHJhbnNmb3JtTW91c2UodGhpcy5jYW1lcmEpO1xuXHRcdHRoaXMubWFwR2VuZXJhdG9yLnVwZGF0ZSgpO1xuXHRcdHRoaXMubWFwLnVwZGF0ZSh0aGlzLmNvbnRyb2xsZXIsIHRoaXMubW9uc3Rlcktub3dsZWRnZSk7XG5cdFx0dGhpcy5taW5pbWFwLnVwZGF0ZSh0aGlzLmNvbnRyb2xsZXIpO1xuXHR9XG5cblx0dXBkYXRlQ2FtZXJhKCkge1xuXHRcdHRoaXMuY2FtZXJhLm1vdmUodGhpcy5wbGF5ZXIsIHRoaXMuY29udHJvbGxlci5nZXRSYXdNb3VzZSguNSwgLjUpKTtcblx0XHR0aGlzLmNhbWVyYS56b29tKFxuXHRcdFx0S2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUodGhpcy5jb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLlpPT01fT1VUKS5hY3RpdmUsXG5cdFx0XHRLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZSh0aGlzLmNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuWk9PTV9JTikuYWN0aXZlKTtcblx0fVxuXG5cdHBhaW50KCkge1xuXHRcdHRoaXMuc3RhcmZpZWxkLnBhaW50KHRoaXMucGFpbnRlclNldC5wYWludGVyLCB0aGlzLmNhbWVyYSk7XG5cdFx0dGhpcy5tYXAucGFpbnQodGhpcy5wYWludGVyU2V0LnBhaW50ZXIsIHRoaXMuY2FtZXJhKTtcblx0XHRpZiAoVUkpIHtcblx0XHRcdHRoaXMubWluaW1hcC5wYWludCh0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyKTtcblx0XHRcdHRoaXMubWFwLnBhaW50VWkodGhpcy5wYWludGVyU2V0LnVpUGFpbnRlciwgdGhpcy5jYW1lcmEpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG5cbi8vIHRvZG8gW2dyYXBoaWNzXVxuLy8gdGV4dHVyZXNcbi8vIHVpIGludGVyZmFjZVxuXG4vLyB0b2RvIFtjb250ZW50XVxuLy8gbWFwIGdlbmVyYXRpb25cbi8vIGluc3RhbmNlc1xuLy8gbW9ic1xuLy8gc2VjdG9yIG1vZGVzXG4vLyByZXNvdXJjZXNcbi8vIGNyYWZ0aW5nXG4vLyBza2lsbCBsZXZlbGluZ1xuXG4vLyB0b2RvIFtvdGhlcl1cbi8vIGNoYXRcbi8vIHNhdmVcbi8vIG1pbmltYXBcbi8vIGNvbnNpZGVyIHJlc3RydWN0dXJpbmcgcGFja2FnZXMuIHNyYz5hYmlsaXRpZXMgJiBzcmM+ZW50aXRpZXM+bW9kdWxlIHIgc3ltbWV0cmljXG5cbi8vIHRvZG8gW21vbnN0ZXJdXG4vLyBza2lybWVyc2hlclxuLy8gbGFzZXIsIHNob3J0IHJhbmdlIHJhaWRlcnNcbi8vIGxhdGNoZXJzIHRoYXQgcmVkdWNlIG1heCBoZWFsdGhcbi8vIGxpbmtlcnMgdGhhdCByZWR1Y2Ugc3BlZWQgYW5kIGRyYWluIGhlYWx0aFxuLy8gdHJhcHNcbi8vIGRvdHNcbiIsImNvbnN0IExvZ2ljID0gcmVxdWlyZSgnLi9Mb2dpYycpO1xuY29uc3QgVGVzdFNoaXAgPSByZXF1aXJlKCcuLi9ncmFwaGljcy9UZXN0U2hpcCcpO1xuY29uc3Qge3RoZXRhVG9WZWN0b3J9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcblxuY29uc3QgaWRmID0gYSA9PiBhO1xuXG5jbGFzcyBHcmFwaGljc0RlbW8gZXh0ZW5kcyBMb2dpYyB7XG5cdGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpIHtcblx0XHRzdXBlcihjb250cm9sbGVyLCBwYWludGVyU2V0KTtcblx0XHR0aGlzLncgPSAuMjtcblx0XHR0aGlzLmggPSAuMjtcblx0XHR0aGlzLnggPSAuNTtcblx0XHR0aGlzLnkgPSAuNTtcblx0XHR0aGlzLnRoZXRhID0gMDtcblx0XHR0aGlzLmR0aGV0YSA9IC4wNSAqIE1hdGguUEkgLyAxODA7XG5cdFx0dGhpcy5zaGlwID0gbmV3IFRlc3RTaGlwKHRoaXMudywgdGhpcy5oKTtcblx0XHR0aGlzLmZha2VDYW1lcmEgPSB7eHQ6IGlkZiwgeXQ6IGlkZiwgc3Q6IGlkZn07XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHRcdHRoaXMuc2hpcCA9IG5ldyBUZXN0U2hpcCh0aGlzLncsIHRoaXMuaCk7IC8vIG1ha2VzIGl0IGVhc3kgdG8gcGx1ZyBpbiB3aW5kb3cgdmFyaWFibGVzIGluIGNvbnN0cnVjdG9yIHRvIGVkaXQgbGl2ZVxuXHRcdGxldCBkaXJlY3Rpb24gPSB0aGV0YVRvVmVjdG9yKHRoaXMudGhldGEgKz0gdGhpcy5kdGhldGEpO1xuXHRcdHRoaXMuc2hpcC5wYWludCh0aGlzLnBhaW50ZXJTZXQucGFpbnRlciwgdGhpcy5mYWtlQ2FtZXJhLCB0aGlzLngsIHRoaXMueSwge3g6IGRpcmVjdGlvblswXSwgeTogZGlyZWN0aW9uWzFdfSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcmFwaGljc0RlbW87XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IEJ1dHRvbiA9IHJlcXVpcmUoJy4uL2ludGVyZmFjZS9CdXR0b24nKTtcblxuY2xhc3MgSW50ZXJmYWNlRGVtbyBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlclNldCkge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpO1xuXG5cdFx0dGhpcy5pbnRlcmZhY2UgPSBuZXcgQnV0dG9uKCk7XG5cdFx0dGhpcy5pbnRlcmZhY2Uuc2V0UG9zaXRpb24oLjI1LCAuMjUsIC4yLCAuMDQpO1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLmludGVyZmFjZS51cGRhdGUodGhpcy5jb250cm9sbGVyKTtcblx0XHR0aGlzLmludGVyZmFjZS5wYWludCh0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEludGVyZmFjZURlbW87XG4iLCJjbGFzcyBMb2dpYyB7XG5cdGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpIHtcblx0XHR0aGlzLmNvbnRyb2xsZXIgPSBjb250cm9sbGVyO1xuXHRcdHRoaXMucGFpbnRlclNldCA9IHBhaW50ZXJTZXQ7XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9naWM7XG4iLCJjb25zdCBDb250cm9sbGVyID0gcmVxdWlyZSgnLi4vY29udHJvbC9Db250cm9sbGVyJyk7XHJcbmNvbnN0IFBhaW50ZXJDb21wb3NpdG9yID0gcmVxdWlyZSgnLi4vcGFpbnRlci9QYWludGVyQ29tcG9zaXRvcicpO1xyXG5jb25zdCBGcHNUcmFja2VyID0gcmVxdWlyZSgnLi4vdXRpbC9GcHNUcmFja2VyJyk7XHJcbmNvbnN0IFRleHQgPSByZXF1aXJlKCcuLi9wYWludGVyL1RleHQnKTtcclxuXHJcbmNsYXNzIExvb3BlciB7XHJcblx0c3RhdGljIHNsZWVwKG1pbGxpKSB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1pbGxpKSlcclxuXHR9XHJcblxyXG5cdGNvbnN0cnVjdG9yKGNhbnZhcykge1xyXG5cdFx0dGhpcy5jYW52YXMgPSBjYW52YXM7XHJcblx0XHR0aGlzLmNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihjYW52YXMpO1xyXG5cdFx0dGhpcy5wYWludGVyU2V0ID0gbmV3IFBhaW50ZXJDb21wb3NpdG9yKGNhbnZhcyk7XHJcblx0XHR0aGlzLmZwc1RyYWNrZXIgPSBuZXcgRnBzVHJhY2tlcigpO1xyXG5cdFx0dGhpcy5sb29wKCk7XHJcblx0fVxyXG5cclxuXHRzZXRMb2dpY0NsYXNzKExvZ2ljQ2xhc3MpIHtcclxuXHRcdHRoaXMubG9naWMgPSBuZXcgTG9naWNDbGFzcyh0aGlzLmNvbnRyb2xsZXIsIHRoaXMucGFpbnRlclNldCk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBsb29wKCkge1xyXG5cdFx0d2hpbGUgKHRydWUpIHtcclxuXHRcdFx0YXdhaXQgTG9vcGVyLnNsZWVwKDEwKTtcclxuXHRcdFx0aWYgKCF0aGlzLmxvZ2ljKVxyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR0aGlzLnBhaW50ZXJTZXQuY2xlYXIoKTtcclxuXHRcdFx0dGhpcy5sb2dpYy5pdGVyYXRlKCk7XHJcblx0XHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKG5ldyBUZXh0KC45NywgLjAzLCB0aGlzLmZwc1RyYWNrZXIuZ2V0RnBzKCkpKTtcclxuXHRcdFx0dGhpcy5wYWludGVyU2V0LnBhaW50KCk7XHJcblx0XHRcdHRoaXMuY29udHJvbGxlci5leHBpcmUoKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTG9vcGVyO1xyXG4iLCJjb25zdCBMaW5rZWRMaXN0ID0gcmVxdWlyZSgnLi4vdXRpbC9MaW5rZWRMaXN0Jyk7XG5jb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9FbnRpdHknKTtcbmNvbnN0IExvZ2ljID0gcmVxdWlyZSgnLi9Mb2dpYycpO1xuY29uc3QgTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi4vbWFwL01hcEdlbmVyYXRvckFyZW5hJyk7XG5jb25zdCBDYW1lcmEgPSByZXF1aXJlKCcuLi9jYW1lcmEvQ2FtZXJhJyk7XG5jb25zdCBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWwvQ29sb3InKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBGYWtlUGxheWVyIHtcblx0c2V0UG9zaXRpb24oKSB7XG5cdH1cbn1cblxuY2xhc3MgRmFrZU1hcCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuc3RpbGxzID0gbmV3IExpbmtlZExpc3QoKTtcblx0XHR0aGlzLm1vbnN0ZXJzID0gbmV3IExpbmtlZExpc3QoKTtcblx0fVxuXG5cdHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0fVxuXG5cdGFkZFN0aWxsKHN0aWxsKSB7XG5cdFx0dGhpcy5zdGlsbHMuYWRkKHN0aWxsKTtcblx0fVxuXG5cdGFkZFBsYXllcihwbGF5ZXIpIHtcblx0fVxuXG5cdGFkZE1vbnN0ZXIobW9uc3Rlcikge1xuXHRcdHRoaXMubW9uc3RlcnMuYWRkKG1vbnN0ZXIpO1xuXHR9XG5cblx0YWRkVWkodWkpIHtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHRoaXMuc3RpbGxzLmZvckVhY2goc3RpbGwgPT4gc3RpbGwucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5tb25zdGVycy5mb3JFYWNoKG1vbnN0ZXIgPT4gRW50aXR5LnByb3RvdHlwZS5wYWludC5jYWxsKG1vbnN0ZXIsIHBhaW50ZXIsIGNhbWVyYSkpOyAvLyB0byBhdm9pZCBwYWludGluZyBtb2R1bGVzXG5cdH1cbn1cblxuY2xhc3MgTWFwRGVtbyBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlclNldCkge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpO1xuXHRcdHRoaXMucmVzZXQoKTtcblx0XHR0aGlzLmNhbWVyYSA9IG5ldyBDYW1lcmEodGhpcy5tYXAud2lkdGggLyAyLCB0aGlzLm1hcC5oZWlnaHQgLyAyLCAodGhpcy5tYXAud2lkdGggKyB0aGlzLm1hcC5oZWlnaHQpIC8gMik7XG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLm1hcCA9IG5ldyBGYWtlTWFwKCk7XG5cdFx0dGhpcy5wbGF5ZXIgPSBuZXcgRmFrZVBsYXllcigpO1xuXHRcdG5ldyBNYXBHZW5lcmF0b3IodGhpcy5tYXAsIHRoaXMucGxheWVyKS5nZW5lcmF0ZSgpO1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCcgJykucHJlc3NlZClcblx0XHRcdHRoaXMucmVzZXQoKTtcblxuXHRcdHRoaXMudXBkYXRlQ2FtZXJhKCk7XG5cblx0XHR0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKHRoaXMuY2FtZXJhLCB0aGlzLm1hcC53aWR0aCAvIDIsIHRoaXMubWFwLmhlaWdodCAvIDIsIHRoaXMubWFwLndpZHRoLCB0aGlzLm1hcC5oZWlnaHQsIHtjb2xvcjogQ29sb3IuV0hJVEUuZ2V0KCksIHRoaWNrbmVzczogMn0pKTtcblx0XHR0aGlzLm1hcC5wYWludCh0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyLCB0aGlzLmNhbWVyYSk7XG5cdH1cblxuXHR1cGRhdGVDYW1lcmEoKSB7XG5cdFx0bGV0IHt4LCB5fSA9IHRoaXMuY29udHJvbGxlci5nZXRSYXdNb3VzZSguNSwgLjUpO1xuXHRcdHRoaXMuY2FtZXJhLm1vdmUoe3g6IHggKiB0aGlzLm1hcC53aWR0aCwgeTogeSAqIHRoaXMubWFwLmhlaWdodH0sIHt4LCB5fSk7XG5cdFx0dGhpcy5jYW1lcmEuem9vbSh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJ3onKS5hY3RpdmUsIHRoaXMuY29udHJvbGxlci5nZXRLZXlTdGF0ZSgneCcpLmFjdGl2ZSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNYXBEZW1vO1xuIiwiY29uc3QgTG9naWMgPSByZXF1aXJlKCcuL0xvZ2ljJyk7XG5jb25zdCB7Tm9pc2VTaW1wbGV4fSA9IHJlcXVpcmUoJy4uL3V0aWwvTm9pc2UnKTtcbmNvbnN0IHtyYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWwvQ29sb3InKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xuXG5jb25zdCBUSFJFU0hPTEQgPSAuNTtcbmNvbnN0IE4gPSAyMDA7IC8vIHJlc29sdXRpb25cbmNvbnN0IE5USCA9IDEgLyBOO1xuY29uc3QgREVGQVVMVF9OT0lTRV9SQU5HRSA9IDIwOyAvLyBmZWF0dXJlIHNpemVzLCBiaWdnZXIgbm9pc2VSYW5nZSBtZWFucyBzbWFsbGVyIGZlYXR1cmVzXG5cbmNsYXNzIE5vaXNlRGVtbyBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlclNldCkge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpO1xuXHRcdHRoaXMubm9pc2VSYW5nZSA9IERFRkFVTFRfTk9JU0VfUkFOR0U7XG5cdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0dGhpcy5yZXN1bHRzID0gW107XG5cdFx0bGV0IG5vaXNlID0gbmV3IE5vaXNlU2ltcGxleCh0aGlzLm5vaXNlUmFuZ2UpO1xuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgTjsgeCsrKSB7XG5cdFx0XHR0aGlzLnJlc3VsdHNbeF0gPSBbXTtcblx0XHRcdGZvciAobGV0IHkgPSAwOyB5IDwgTjsgeSsrKSB7XG5cdFx0XHRcdGxldCByID0gbm9pc2UuZ2V0KHggKiBOVEgsIHkgKiBOVEgpO1xuXHRcdFx0XHRpZiAociA+IFRIUkVTSE9MRCArIHJhbmQoKSlcblx0XHRcdFx0XHR0aGlzLnJlc3VsdHNbeF1beV0gPSB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGl0ZXJhdGUoKSB7XG5cdFx0dGhpcy5jb250cm9sKCk7XG5cdFx0dGhpcy5wYWludCgpO1xuXHR9XG5cblx0Y29udHJvbCgpIHtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd2Rvd24nKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5ub2lzZVJhbmdlIC09IDU7XG5cdFx0aWYgKHRoaXMuY29udHJvbGxlci5nZXRLZXlTdGF0ZSgnYXJyb3d1cCcpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UgKz0gNTtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd2xlZnQnKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5ub2lzZVJhbmdlLS07XG5cdFx0aWYgKHRoaXMuY29udHJvbGxlci5nZXRLZXlTdGF0ZSgnYXJyb3dyaWdodCcpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UrKztcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCcgJykucHJlc3NlZClcblx0XHRcdHRoaXMucmVzZXQoKTtcblx0fVxuXG5cdHBhaW50KCkge1xuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgTjsgeCsrKVxuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBOOyB5KyspIHtcblx0XHRcdFx0aWYgKHRoaXMucmVzdWx0c1t4XVt5XSkge1xuXHRcdFx0XHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKG5ldyBSZWN0KHggKiBOVEgsIHkgKiBOVEgsIDEgLyBOLCAxIC8gTiwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvci5CTEFDSy5nZXQoKX0pKTtcblx0XHRcdFx0XHR0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyLmFkZChuZXcgUmVjdEMoLjEsIC4xLCAuMDMsIC4wMywge2ZpbGw6IHRydWUsIGNvbG9yOiBgI2ZmZmB9KSk7XG5cdFx0XHRcdFx0dGhpcy5wYWludGVyU2V0LnVpUGFpbnRlci5hZGQobmV3IFRleHQoLjEsIC4xLCB0aGlzLm5vaXNlUmFuZ2UpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTm9pc2VEZW1vO1xuIiwiY29uc3QgTG9naWMgPSByZXF1aXJlKCcuL0xvZ2ljJyk7XG5jb25zdCBDYW1lcmEgPSByZXF1aXJlKCcuLi9jYW1lcmEvQ2FtZXJhJyk7XG5jb25zdCBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWwvQ29sb3InKTtcbmNvbnN0IFRleHQgPSByZXF1aXJlKCcuLi9wYWludGVyL1RleHQnKTtcbmNvbnN0IFN0YXJmaWVsZCA9IHJlcXVpcmUoJy4uL3N0YXJmaWVsZC9TdGFyZmllbGQnKTtcbmNvbnN0IFN0YXJmaWVsZE5vaXNlID0gcmVxdWlyZSgnLi4vc3RhcmZpZWxkL1N0YXJmaWVsZE5vaXNlJyk7XG5cbmNsYXNzIFN0YXJmaWVsZERlbW8gZXh0ZW5kcyBMb2dpYyB7XG5cdGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpIHtcblx0XHRzdXBlcihjb250cm9sbGVyLCBwYWludGVyU2V0KTtcblx0XHR0aGlzLmNhbWVyYSA9IG5ldyBDYW1lcmEoMCwgMCwgMSk7XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHRcdHRoaXMucGVyaW9kaWNhbGx5U3dhcFN0YXJmaWVsZCgpO1xuXHRcdGxldCB7eCwgeX0gPSB0aGlzLmNvbnRyb2xsZXIuZ2V0UmF3TW91c2UoKTtcblx0XHR0aGlzLmNhbWVyYS5tb3ZlKHt4OiB4IC0gLjUsIHk6IHkgLSAuNX0sIHt4LCB5fSk7XG5cdFx0dGhpcy5zdGFyZmllbGQucGFpbnQodGhpcy5wYWludGVyU2V0LnVpUGFpbnRlciwgdGhpcy5jYW1lcmEpO1xuXHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKG5ldyBUZXh0KC4wNSwgLjA1LCB0aGlzLm5vaXNlID8gJ25vaXNlJyA6ICdyYW5kJywge2NvbG9yOiBDb2xvci5XSElURS5nZXQoKX0pKTtcblx0fVxuXG5cdHBlcmlvZGljYWxseVN3YXBTdGFyZmllbGQoKSB7XG5cdFx0aWYgKCF0aGlzLml0ZXIpIHtcblx0XHRcdHRoaXMuaXRlciA9IDEwMDtcblx0XHRcdHRoaXMubm9pc2UgPSAhdGhpcy5ub2lzZTtcblx0XHRcdHRoaXMuc3RhcmZpZWxkID0gdGhpcy5ub2lzZSA/IG5ldyBTdGFyZmllbGROb2lzZSgxLCAxKSA6IG5ldyBTdGFyZmllbGQoMSwgMSk7XG5cdFx0fVxuXHRcdHRoaXMuaXRlci0tO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhcmZpZWxkRGVtbztcbiIsImNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IExpbmtlZExpc3QgPSByZXF1aXJlKCcuLi91dGlsL0xpbmtlZExpc3QnKTtcbmNvbnN0IEJvdW5kcyA9IHJlcXVpcmUoJy4uL2ludGVyc2VjdGlvbi9Cb3VuZHMnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcblxuY2xhc3MgTWFwIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIgPSBuZXcgSW50ZXJzZWN0aW9uRmluZGVyKCk7XG5cdFx0dGhpcy5zdGlsbHMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMubW9uc3RlcnMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMucHJvamVjdGlsZXMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMucGFydGljbGVzID0gbmV3IExpbmtlZExpc3QoKTtcblx0XHR0aGlzLnVpcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdH1cblxuXHRzZXRTaXplKHdpZHRoLCBoZWlnaHQpIHtcblx0XHR0aGlzLndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cdH1cblxuXHRnZXRTaXplKCkge1xuXHRcdHJldHVybiBbdGhpcy53aWR0aCwgdGhpcy5oZWlnaHRdO1xuXHR9XG5cblx0YWRkU3RpbGwoc3RpbGwpIHtcblx0XHR0aGlzLnN0aWxscy5hZGQoc3RpbGwpO1xuXHRcdHN0aWxsLmFkZEludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdH1cblxuXHRhZGRQbGF5ZXIocGxheWVyKSB7XG5cdFx0dGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cdFx0cGxheWVyLmFkZEludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0dGhpcy51aXMuYWRkKHBsYXllcik7XG5cdH1cblxuXHRhZGRNb25zdGVyKG1vbnN0ZXIsIHVpKSB7XG5cdFx0dGhpcy5tb25zdGVycy5hZGQobW9uc3Rlcik7XG5cdFx0bW9uc3Rlci5hZGRJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHRcdGlmICh1aSlcblx0XHRcdHRoaXMudWlzLmFkZChtb25zdGVyKTtcblx0fVxuXG5cdGFkZFVpKHVpKSB7XG5cdFx0dGhpcy51aXMuYWRkKHVpKTtcblx0fVxuXG5cdGFkZFByb2plY3RpbGUocHJvamVjdGlsZSkgeyAvLyB0b2RvIFttZWRdIHJlbmFtZSB0byBhZGRBdHRhY2sgb3Igc3VjaFxuXHRcdHRoaXMucHJvamVjdGlsZXMuYWRkKHByb2plY3RpbGUpO1xuXHRcdHByb2plY3RpbGUuYWRkSW50ZXJzZWN0aW9uQm91bmRzKHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0fVxuXG5cdGFkZFBhcnRpY2xlKHBhcnRpY2xlKSB7XG5cdFx0dGhpcy5wYXJ0aWNsZXMuYWRkKHBhcnRpY2xlKTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XG5cdFx0dGhpcy5wbGF5ZXIudXBkYXRlKHRoaXMsIGNvbnRyb2xsZXIsIHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2goKG1vbnN0ZXIsIGl0ZW0pID0+IHtcblx0XHRcdGlmIChtb25zdGVyLmhlYWx0aC5pc0VtcHR5KCkpIHtcblx0XHRcdFx0dGhpcy5tb25zdGVycy5yZW1vdmUoaXRlbSk7XG5cdFx0XHRcdG1vbnN0ZXIucmVtb3ZlSW50ZXJzZWN0aW9uQm91bmRzKHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0XHRcdH0gZWxzZVxuXHRcdFx0XHRtb25zdGVyLnVwZGF0ZSh0aGlzLCB0aGlzLmludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcy5mb3JFYWNoKChwcm9qZWN0aWxlLCBpdGVtKSA9PiB7XG5cdFx0XHRpZiAocHJvamVjdGlsZS51cGRhdGUodGhpcywgdGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpKSB7XG5cdFx0XHRcdHRoaXMucHJvamVjdGlsZXMucmVtb3ZlKGl0ZW0pO1xuXHRcdFx0XHRwcm9qZWN0aWxlLnJlbW92ZUludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0dGhpcy5wYXJ0aWNsZXMuZm9yRWFjaCgocGFydGljbGUsIGl0ZW0pID0+IHtcblx0XHRcdGlmIChwYXJ0aWNsZS51cGRhdGUoKSlcblx0XHRcdFx0dGhpcy5wYXJ0aWNsZXMucmVtb3ZlKGl0ZW0pO1xuXHRcdH0pO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0dGhpcy5zdGlsbHMuZm9yRWFjaChzdGlsbCA9PiBzdGlsbC5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0XHR0aGlzLnBsYXllci5wYWludChwYWludGVyLCBjYW1lcmEpO1xuXHRcdHRoaXMubW9uc3RlcnMuZm9yRWFjaChtb25zdGVyID0+IG1vbnN0ZXIucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcy5mb3JFYWNoKHByb2plY3RpbGUgPT4gcHJvamVjdGlsZS5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0XHR0aGlzLnBhcnRpY2xlcy5mb3JFYWNoKHBhcnRpY2xlID0+IHBhcnRpY2xlLnBhaW50KHBhaW50ZXIsIGNhbWVyYSkpO1xuXHR9XG5cblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcblx0XHR0aGlzLnVpcy5mb3JFYWNoKCh1aSwgaXRlcikgPT4ge1xuXHRcdFx0aWYgKHVpLnJlbW92ZVVpKCkpXG5cdFx0XHRcdHRoaXMudWlzLnJlbW92ZShpdGVyKTtcblx0XHRcdGVsc2Vcblx0XHRcdFx0dWkucGFpbnRVaShwYWludGVyLCBjYW1lcmEpO1xuXHRcdH0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwO1xuXG4vLyB0b2RvIFttZWRpdW1dIGNvbnNpZGVyIHN0YXRpYyAmIGR5bmFtaWMgZW50aXR5IGxpc3RzIGluIHN0ZWFkIG9mIGluZGl2aWR1YWwgdHlwZSBlbnRpdHkgbGlzdHNcbiIsImNvbnN0IHtOb2lzZVNpbXBsZXh9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xuY29uc3Qge3JhbmQsIHJvdW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBNYXBCb3VuZGFyeSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL01hcEJvdW5kYXJ5Jyk7XG5jb25zdCBSb2NrID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvUm9jaycpO1xuY29uc3QgUm9ja01pbmVyYWwgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9Sb2NrTWluZXJhbCcpO1xuY29uc3QgQ2hhbXBpb24gPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9DaGFtcGlvbicpO1xuY29uc3QgRXhwbG9kaW5nVGljayA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0V4cGxvZGluZ1RpY2snKTtcbmNvbnN0IFNuaXBlclRpY2sgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9TbmlwZXJUaWNrJyk7XG5jb25zdCBTdGF0aWM0RGlyVHVycmV0ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vU3RhdGljNERpclR1cnJldCcpO1xuY29uc3QgQWltaW5nTGFzZXJUdXJyZXQgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9BaW1pbmdMYXNlclR1cnJldCcpO1xuY29uc3QgTWVjaGFuaWNhbEJvc3NFYXJseSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL01lY2hhbmljYWxCb3NzRWFybHknKTtcbmNvbnN0IEJvbWJMYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0JvbWJMYXllcicpO1xuY29uc3QgRGFzaENoYXNlciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0Rhc2hDaGFzZXInKTtcbmNvbnN0IE1lY2hhbmljYWxCb3NzID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vTWVjaGFuaWNhbEJvc3MnKTtcbmNvbnN0IHtQb3NpdGlvbnN9ID0gcmVxdWlyZSgnLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFRleHQgPSByZXF1aXJlKCcuLi9wYWludGVyL1RleHQnKTtcblxuY29uc3QgV0lEVEggPSAxLjUsIEhFSUdIVCA9IDEuNTtcbmNvbnN0IFNQQVdOX0RJU1QgPSAzIC8gNDtcblxuY29uc3QgU1RBR0VfU1BBV05TID0gW1xuXHQvLyBbXG5cdC8vIFx0W01lY2hhbmljYWxCb3NzRWFybHksIDFdLFxuXHQvLyBdLFxuXHQvLyBbXG5cdC8vIFx0W01lY2hhbmljYWxCb3NzLCAxXSxcblx0Ly8gXSxcblx0W1xuXHRcdFtFeHBsb2RpbmdUaWNrLCAzXSxcblx0XSxcblx0W1xuXHRcdFtFeHBsb2RpbmdUaWNrLCAyXSxcblx0XHRbU25pcGVyVGljaywgMl0sXG5cdF0sXG5cdFtcblx0XHRbU3RhdGljNERpclR1cnJldCwgM10sXG5cdFx0W0FpbWluZ0xhc2VyVHVycmV0LCAyXSxcblx0XSxcblx0W1xuXHRcdFtFeHBsb2RpbmdUaWNrLCA0XSxcblx0XHRbU25pcGVyVGljaywgNF0sXG5cdFx0W1N0YXRpYzREaXJUdXJyZXQsIDJdLFxuXHRdLFxuXHRbXG5cdFx0W01lY2hhbmljYWxCb3NzRWFybHksIDFdLFxuXHRdLFxuXHRbXG5cdFx0W0JvbWJMYXllciwgM10sXG5cdFx0W0Rhc2hDaGFzZXIsIDRdLFxuXHRdLFxuXHRbXG5cdFx0W0FpbWluZ0xhc2VyVHVycmV0LCAyXSxcblx0XHRbQm9tYkxheWVyLCA0XSxcblx0XHRbRGFzaENoYXNlciwgM10sXG5cdF0sXG5cdFtcblx0XHRbU25pcGVyVGljaywgM10sXG5cdFx0W1N0YXRpYzREaXJUdXJyZXQsIDNdLFxuXHRcdFtBaW1pbmdMYXNlclR1cnJldCwgM10sXG5cdFx0W0JvbWJMYXllciwgM10sXG5cdFx0W0Rhc2hDaGFzZXIsIDNdLFxuXHRdLFxuXHRbXG5cdFx0W0V4cGxvZGluZ1RpY2ssIDRdLFxuXHRcdFtTbmlwZXJUaWNrLCA0XSxcblx0XHRbU3RhdGljNERpclR1cnJldCwgNF0sXG5cdFx0W0FpbWluZ0xhc2VyVHVycmV0LCA0XSxcblx0XHRbQm9tYkxheWVyLCA0XSxcblx0XHRbRGFzaENoYXNlciwgNF0sXG5cdF0sXG5cdFtcblx0XHRbTWVjaGFuaWNhbEJvc3MsIDFdLFxuXHRdLFxuXHRbXG5cdFx0W0V4cGxvZGluZ1RpY2ssIDRdLFxuXHRcdFtTbmlwZXJUaWNrLCA0XSxcblx0XHRbU3RhdGljNERpclR1cnJldCwgNF0sXG5cdFx0W0FpbWluZ0xhc2VyVHVycmV0LCA0XSxcblx0XHRbQm9tYkxheWVyLCA0XSxcblx0XHRbRGFzaENoYXNlciwgNF0sXG5cdF0sXG5dO1xuXG5jbGFzcyBNYXBHZW5lcmF0b3JBcmVuYSB7XG5cdGNvbnN0cnVjdG9yKG1hcCwgcGxheWVyKSB7XG5cdFx0Y29uc3QgT0NDVVBJRURfTk9JU0UgPSAyLCBST0NLX05PSVNFID0gNTtcblxuXHRcdHRoaXMub2NjdXBpZWROb2lzZSA9IG5ldyBOb2lzZVNpbXBsZXgoT0NDVVBJRURfTk9JU0UpO1xuXHRcdHRoaXMucm9ja05vaXNlID0gbmV3IE5vaXNlU2ltcGxleChST0NLX05PSVNFKTtcblxuXHRcdHRoaXMubWFwID0gbWFwO1xuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHR9XG5cblx0Z2VuZXJhdGUoKSB7XG5cdFx0dGhpcy5tYXAuc2V0U2l6ZShXSURUSCwgSEVJR0hUKTtcblxuXHRcdHRoaXMuZ2VuZXJhdGVCb3VuZGFyaWVzKCk7XG5cdFx0dGhpcy5nZW5lcmF0ZVJvY2tzKCk7XG5cblx0XHR0aGlzLnN0YWdlRW50aXRpZXMgPSBbXTtcblx0XHR0aGlzLnN0YWdlID0gMDtcblx0XHR0aGlzLnRpbWVyID0gMDtcblxuXHRcdHRoaXMucGxheWVyLnNldFBvc2l0aW9uKFdJRFRIICogU1BBV05fRElTVCwgSEVJR0hUICogU1BBV05fRElTVCk7XG5cdFx0dGhpcy5tYXAuYWRkUGxheWVyKHRoaXMucGxheWVyKTtcblx0XHR0aGlzLm1hcC5hZGRVaSh0aGlzKTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHR0aGlzLnRpbWVyKys7XG5cdFx0aWYgKHRoaXMuc3RhZ2VFbnRpdGllcy5ldmVyeShlbnRpdHkgPT4gZW50aXR5LmhlYWx0aC5pc0VtcHR5KCkpKSB7XG5cdFx0XHRsZXQgZW50aXRpZXMgPSB0aGlzLmNyZWF0ZU1vbnN0ZXJzKHRoaXMuc3RhZ2UrKyk7XG5cdFx0XHRlbnRpdGllcy5mb3JFYWNoKChbZW50aXR5LCB1aV0pID0+IHtcblx0XHRcdFx0d2hpbGUgKCFlbnRpdHkuY2hlY2tQb3NpdGlvbih0aGlzLm1hcC5pbnRlcnNlY3Rpb25GaW5kZXIpKSB7XG5cdFx0XHRcdFx0bGV0IHBvc2l0aW9uID0gdGhpcy5vY2N1cGllZE5vaXNlLnBvc2l0aW9ucygxLCBXSURUSCwgSEVJR0hUKVswXTtcblx0XHRcdFx0XHRlbnRpdHkuc2V0UG9zaXRpb24oLi4ucG9zaXRpb24pO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMubWFwLmFkZE1vbnN0ZXIoZW50aXR5LCB1aSk7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuc3RhZ2VFbnRpdGllcyA9IGVudGl0aWVzLm1hcCgoW2VudGl0eV0pID0+IGVudGl0eSk7XG5cdFx0fVxuXHR9XG5cblx0Z2VuZXJhdGVCb3VuZGFyaWVzKCkge1xuXHRcdE1hcEJvdW5kYXJ5LmNyZWF0ZUJveEJvdW5kYXJpZXMoV0lEVEgsIEhFSUdIVCkuZm9yRWFjaChtYXBCb3VuZGFyeSA9PiB0aGlzLm1hcC5hZGRTdGlsbChtYXBCb3VuZGFyeSkpO1xuXHR9XG5cblx0Z2VuZXJhdGVSb2NrcygpIHtcblx0XHRjb25zdCBST0NLUyA9IDMsIFJPQ0tfTUlORVJBTFMgPSAxO1xuXHRcdGNvbnN0IFJPQ0tfTUFYX1NJWkUgPSAuMztcblx0XHR0aGlzLnJvY2tOb2lzZS5wb3NpdGlvbnMoUk9DS1MsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gdGhpcy5tYXAuYWRkU3RpbGwobmV3IFJvY2soLi4ucG9zaXRpb24sIHJhbmQoUk9DS19NQVhfU0laRSkpKSk7XG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tfTUlORVJBTFMsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gdGhpcy5tYXAuYWRkU3RpbGwobmV3IFJvY2tNaW5lcmFsKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xuXHR9XG5cblx0Y3JlYXRlTW9uc3RlcnMoc3RhZ2UpIHtcblx0XHRsZXQgc3Bhd25zID0gU1RBR0VfU1BBV05TW01hdGgubWluKHN0YWdlLCBTVEFHRV9TUEFXTlMubGVuZ3RoIC0gMSldO1xuXHRcdGxldCBtdWx0aXBsaWVyID0gTWF0aC5tYXgoc3RhZ2UgLSBTVEFHRV9TUEFXTlMubGVuZ3RoICsgMiwgMSk7XG5cdFx0cmV0dXJuIHNwYXducy5tYXAoKFtNb25zdGVyQ2xhc3MsIGNvdW50XSkgPT5cblx0XHRcdFsuLi5BcnJheShjb3VudCAqIG11bHRpcGxpZXIpXVxuXHRcdFx0XHQubWFwKCgpID0+IFtuZXcgTW9uc3RlckNsYXNzKCksIGZhbHNlXSkpXG5cdFx0XHQuZmxhdCgpO1xuXHR9XG5cblx0cmVtb3ZlVWkoKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcblx0XHRsZXQgZm9udCA9IHtzaXplOiAnMTZweCcsIGFsaWduOiAncmlnaHQnfTtcblx0XHRwYWludGVyLmFkZChuZXcgVGV4dChcblx0XHRcdDEgLSBQb3NpdGlvbnMuTUFSR0lOLFxuXHRcdFx0UG9zaXRpb25zLk1BUkdJTiAqIDIgKyBQb3NpdGlvbnMuQkFSX0hFSUdIVCAqIDIsXG5cdFx0XHRgJHt0aGlzLnN0YWdlfSA6ICR7cm91bmQodGhpcy50aW1lciAvIDEwMCl9YCwgZm9udCkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwR2VuZXJhdG9yQXJlbmE7XG5cbi8qXG4xMjM0NTZcblxuMVxuMTJcbjM0XG4xMjNcblxuNTZcbjQ1NlxuMjM0NTYgLSAxXG4xMjQzNTZcblxuT1JcbjEyMzQ1NlxuMTIzNDU2XG4xMjM0NTZcbjEyMzQ1NlxuXG4xXG4xMlxuMzRcbjEyM1xuXG40NTZcbjIzNTZcbjI0NTZcbjEzNDU2XG5cbmV4cGxvZGluZyB0aWNrICAgICAgICAgIGRlZ2VuIHdoaWxlIG1vdmluZ1xuc25pcGVyIHRpY2sgICAgICAgICAgICAgc2hvdCBsZWF2ZXMgdGVtcG9yYXJ5IHNwaGVyZXMgaW4gdHJhaWxcbmZpeGVkIDQtd2F5IHR1cnJldCAgICAgIGFsdGVybmF0ZXMgdG8gZGlhZ29uYWxcbmFpbWluZyAxLXdheSB0dXJyZXQgICAgIHRyaXBsZSBsYXNlclxuYm9tYiBsYXllclxuY2hhcmdlclxuXG5tZWxlZSBkYXJ0XG5tZWxlZSBkYXJ0IHNwYXduZXIgc2hpcFxuZGVnZW4gdHVycmV0IG9yIHR1cnJldCB3aXRoIHNwaW5uaW5nIGRlZ2VuIHRpbnkgbW9ic1xudHVycmV0IHdpdGggc3RhdGljICYgaW5hY3RpdmUgdGlueSBtb2JzLCB0aGF0IHBlcmlvZGljYWxseSBjaGFyZ2UgdGhlIHBsYXllciB3aXRoIHNsb3cgcm90YXRpb25cbndhbGwgb2YgcHJvamVjdGlsZXNcbmZyb250YWwgZGVnZW4gcmVjdGFuZ2xlXG5cbm1lbGVlIHNsb3cgZGVidWZmXG5yYW5nZWQgaGVhbCBhbGxpZXMgZGVidWZmXG5zcGlubmluZyB0dXJyZXRcbmRlbGF5ZWQgbWlzc2lsZSB0dXJyZXRcbmVuY2lyY2xpbmcgY2lyY2xlIGZvIGJvbWJzXG5yYXBpZCBmaXJpbmcsIHNsb3cgbW92aW5nLCBzaG9ydCByYW5nZSBwcm9qZWN0aWxlIG1hY2hpbmUgZ3VuXG5cbmdhbWUgbW9kZXM6IGRlZmVuc2UsIGJvc3MgZmlnaHRzLCBraWxsIG91dHBvc3QgcG9ydGFscywgYW5kIGFyZW5hXG4qL1xuIiwiY29uc3QgS2V5bWFwcGluZyA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvS2V5bWFwcGluZycpO1xuY29uc3QgQ2FtZXJhID0gcmVxdWlyZSgnLi4vY2FtZXJhL0NhbWVyYScpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIE1pbmltYXAge1xuXHRjb25zdHJ1Y3RvcihtYXApIHtcblx0XHR0aGlzLm1hcCA9IG1hcDtcblx0fVxuXG5cdHRvZ2dsZVpvb20oKSB7XG5cdFx0dGhpcy56b29tID0gIXRoaXMuem9vbTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyKSB7XG5cdFx0aWYgKEtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuTUlOSU1BUF9aT09NKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy50b2dnbGVab29tKCk7XG5cdH1cblxuXHRjcmVhdGVDYW1lcmEoKSB7XG5cdFx0Y29uc3QgT0ZGU0VUID0gLjAxLCBTQ0FMRV9CQVNFX1NNQUxMID0gLjE1LCBTQ0FMRV9CQVNFX0xBUkdFID0gLjQ7XG5cdFx0bGV0IHNjYWxlID0gKHRoaXMuem9vbSA/IFNDQUxFX0JBU0VfTEFSR0UgOiBTQ0FMRV9CQVNFX1NNQUxMKTtcblx0XHRyZXR1cm4gQ2FtZXJhLmNyZWF0ZUZvclJlZ2lvbih0aGlzLm1hcC53aWR0aCwgT0ZGU0VULCBPRkZTRVQsIHNjYWxlKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0XHRsZXQgY2FtZXJhID0gdGhpcy5jcmVhdGVDYW1lcmEoKTtcblx0XHRwYWludGVyLmFkZChSZWN0LndpdGhDYW1lcmEoY2FtZXJhLCAwLCAwLCB0aGlzLm1hcC53aWR0aCwgdGhpcy5tYXAuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5NaW5pbWFwLkJBQ0tHUk9VTkQuZ2V0KCl9KSk7XG5cdFx0cGFpbnRlci5hZGQoUmVjdC53aXRoQ2FtZXJhKGNhbWVyYSwgMCwgMCwgdGhpcy5tYXAud2lkdGgsIHRoaXMubWFwLmhlaWdodCwge2ZpbGw6IGZhbHNlLCBjb2xvcjogQ29sb3JzLk1pbmltYXAuQk9SREVSLmdldCgpfSkpO1xuXHRcdHRoaXMubWFwLnN0aWxscy5mb3JFYWNoKHJvY2sgPT4gdGhpcy5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHJvY2sueCwgcm9jay55LCBDb2xvcnMuTWluaW1hcC5ST0NLLmdldCgpKSk7XG5cdFx0dGhpcy5tYXAubW9uc3RlcnMuZm9yRWFjaChtb25zdGVyID0+IHRoaXMucGFpbnREb3QocGFpbnRlciwgY2FtZXJhLCBtb25zdGVyLngsIG1vbnN0ZXIueSwgQ29sb3JzLk1pbmltYXAuTU9OU1RFUi5nZXQoKSkpO1xuXHRcdHRoaXMubWFwLnVpcy5mb3JFYWNoKHVpID0+IHRoaXMucGFpbnREb3QocGFpbnRlciwgY2FtZXJhLCB1aS54LCB1aS55LCBDb2xvcnMuTWluaW1hcC5CT1NTLmdldCgpKSk7XG5cdFx0dGhpcy5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHRoaXMubWFwLnBsYXllci54LCB0aGlzLm1hcC5wbGF5ZXIueSwgQ29sb3JzLk1pbmltYXAuUExBWUVSLmdldCgpKTtcblx0fVxuXG5cdHBhaW50RG90KHBhaW50ZXIsIGNhbWVyYSwgeCwgeSwgY29sb3IpIHtcblx0XHRjb25zdCBET1RfU0laRSA9IC4wMiAqIHRoaXMubWFwLndpZHRoO1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB4LCB5LCBET1RfU0laRSwgRE9UX1NJWkUsIHtmaWxsOiB0cnVlLCBjb2xvcn0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbmltYXA7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcblxuY2xhc3MgQmFyIGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmaWxsUmF0aW8sIGVtcHR5Q29sb3IsIGZpbGxDb2xvciwgYm9yZGVyQ29sb3IpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuZW1wdHkgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGVtcHR5Q29sb3J9KTtcblx0XHR0aGlzLmZpbGwgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCAqIGZpbGxSYXRpbywgaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGZpbGxDb2xvcn0pO1xuXHRcdHRoaXMuYm9yZGVyID0gbmV3IFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwge2NvbG9yOiBib3JkZXJDb2xvcn0pO1xuXHR9XG5cblx0cGFpbnQoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0dGhpcy5lbXB0eS5wYWludCh4dCwgeXQsIGNvbnRleHQpO1xuXHRcdHRoaXMuZmlsbC5wYWludCh4dCwgeXQsIGNvbnRleHQpO1xuXHRcdHRoaXMuYm9yZGVyLnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYXI7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcblxuY2xhc3MgQmFyQyBleHRlbmRzIFBhaW50ZXJFbGVtZW50IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgZmlsbFJhdGlvLCBlbXB0eUNvbG9yLCBmaWxsQ29sb3IsIGJvcmRlckNvbG9yKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR4IC09IHdpZHRoIC8gMjtcblx0XHR5IC09IGhlaWdodCAvIDI7XG5cdFx0dGhpcy5lbXB0eSA9IG5ldyBSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZW1wdHlDb2xvcn0pO1xuXHRcdHRoaXMuZmlsbCA9IG5ldyBSZWN0KHgsIHksIHdpZHRoICogZmlsbFJhdGlvLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZmlsbENvbG9yfSk7XG5cdFx0dGhpcy5ib3JkZXIgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7Y29sb3I6IGJvcmRlckNvbG9yfSk7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpbGxSYXRpbywgZW1wdHlDb2xvciwgZmlsbENvbG9yLCBib3JkZXJDb2xvcikge1xuXHRcdHJldHVybiBuZXcgQmFyQyhjYW1lcmEueHQoeCksIGNhbWVyYS55dCh5KSwgY2FtZXJhLnN0KHdpZHRoKSwgY2FtZXJhLnN0KGhlaWdodCksIGZpbGxSYXRpbywgZW1wdHlDb2xvciwgZmlsbENvbG9yLCBib3JkZXJDb2xvcik7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHR0aGlzLmVtcHR5LnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5maWxsLnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5ib3JkZXIucGFpbnQoeHQsIHl0LCBjb250ZXh0KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhckM7XG4iLCJjb25zdCBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyk7XG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi91dGlsL1ZlY3RvcicpO1xuXG5jbGFzcyBMaW5lIGV4dGVuZHMgUGF0aCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHgyLCB5Miwgd2lkdGgsIGdyYXBoaWNPcHRpb25zKSB7XG5cdFx0bGV0IHcgPSBuZXcgVmVjdG9yKHgyIC0geCwgeTIgLSB5KS5yb3RhdGVCeUNvc1NpbigwLCAxKTtcblx0XHR3Lm1hZ25pdHVkZSA9IHdpZHRoO1xuXHRcdGxldCB4eXMgPSBbXG5cdFx0XHRbeCAtIHcueCwgeSAtIHcueV0sXG5cdFx0XHRbeCArIHcueCwgeSArIHcueV0sXG5cdFx0XHRbeDIgKyB3LngsIHkyICsgdy55XSxcblx0XHRcdFt4MiAtIHcueCwgeTIgLSB3LnldLFxuXHRcdF07XG5cdFx0c3VwZXIoeHlzLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHgyLCB5Miwgd2lkdGgsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0cmV0dXJuIG5ldyBMaW5lKGNhbWVyYS54dCh4KSwgY2FtZXJhLnl0KHkpLCBjYW1lcmEueHQoeDIpLCBjYW1lcmEueXQoeTIpLCBjYW1lcmEuc3Qod2lkdGgpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmU7XG4iLCJjbGFzcyBQYWludGVyIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMuY2FudmFzID0gUGFpbnRlci5jcmVhdGVDYW52YXMod2lkdGgsIGhlaWdodCk7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMueENvb3JkaW5hdGVUcmFuc2Zvcm0gPSB4ID0+IHggKiB3aWR0aDtcblx0XHR0aGlzLnlDb29yZGluYXRlVHJhbnNmb3JtID0geSA9PiB5ICogaGVpZ2h0O1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5zZXRGb250TW9kZSgpO1xuXHRcdHRoaXMuZWxlbWVudHMgPSBbXTsgLy8gdG9kbyBbbWVkaXVtXSB0ZXN0IGxpbmtlZCBsaXN0IGluc3RlYWQgb2YgYXJyYXkgZm9yIHBlcmZvcm1hbmNlXG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpIHtcblx0XHRsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7IC8vIHRvZG8gW2xvd10gYmV0dGVyIHdheSBvZiBjcmVhdGluZyBjb250ZXh0XG5cdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblx0XHRyZXR1cm4gY2FudmFzO1xuXHR9XG5cblx0c2V0Rm9udE1vZGUoKSB7XG5cdFx0dGhpcy5jb250ZXh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0dGhpcy5lbGVtZW50cyA9IFtdO1xuXHR9XG5cblx0YWRkKGVsZW1lbnQpIHtcblx0XHR0aGlzLmVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG5cdH1cblxuXHRwYWludCgpIHtcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblx0XHR0aGlzLmVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PlxuXHRcdFx0ZWxlbWVudC5wYWludCh0aGlzLnhDb29yZGluYXRlVHJhbnNmb3JtLCB0aGlzLnlDb29yZGluYXRlVHJhbnNmb3JtLCB0aGlzLmNvbnRleHQpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhaW50ZXI7XG4iLCJjb25zdCBQYWludGVyID0gcmVxdWlyZSgnLi9QYWludGVyJyk7XG5cbmNsYXNzIFBhaW50ZXJDb21wb3NpdG9yIHtcblx0Y29uc3RydWN0b3IoY2FudmFzKSB7XG5cdFx0dGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cdFx0dGhpcy5jb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5wYWludGVyID0gbmV3IFBhaW50ZXIodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHRcdHRoaXMudWlQYWludGVyID0gbmV3IFBhaW50ZXIodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0dGhpcy5wYWludGVyLmNsZWFyKCk7XG5cdFx0dGhpcy51aVBhaW50ZXIuY2xlYXIoKTtcblx0fVxuXG5cdHBhaW50KCkge1xuXHRcdHRoaXMucGFpbnRlci5wYWludCgpO1xuXHRcdHRoaXMudWlQYWludGVyLnBhaW50KCk7XG5cblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblx0XHR0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMucGFpbnRlci5jYW52YXMsIDAsIDApO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy51aVBhaW50ZXIuY2FudmFzLCAwLCAwKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhaW50ZXJDb21wb3NpdG9yO1xuIiwiY29uc3QgQ29sb3IgPSByZXF1aXJlKCcuLi91dGlsL0NvbG9yJyk7XG5cbmNsYXNzIFBhaW50ZXJFbGVtZW50IHtcblx0c2V0RmlsbE1vZGUoY29udGV4dCkge1xuXHRcdGNvbnRleHQuZmlsbFN0eWxlID0gdGhpcy5jb2xvcjtcblx0fVxuXG5cdHNldExpbmVNb2RlKGNvbnRleHQpIHtcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcjtcblx0XHRjb250ZXh0LmxpbmVXaWR0aCA9IHRoaXMudGhpY2tuZXNzIHx8IDE7XG5cdH1cblxuXHRzZXREb3VibGVNb2RlKGNvbnRleHQpIHtcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gQ29sb3IuZnJvbTEoMCwgMCwgMCkuZ2V0KCk7XG5cdFx0Y29udGV4dC5saW5lV2lkdGggPSAxO1xuXHR9XG5cblx0c2V0Rm9udChjb250ZXh0KSB7XG5cdFx0Y29udGV4dC50ZXh0QWxpZ24gPSB0aGlzLmFsaWduO1xuXHRcdGNvbnRleHQuZm9udCA9IGAke3RoaXMuc2l6ZX0gbW9ub3NwYWNlYDtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhaW50ZXJFbGVtZW50O1xuIiwiY29uc3QgUGFpbnRlckVsZW1lbnQgPSByZXF1aXJlKCcuL1BhaW50ZXJFbGVtZW50Jyk7XG5cbmNsYXNzIFBhdGggZXh0ZW5kcyBQYWludGVyRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKHh5cywgY2xvc2VkLCB7ZmlsbCwgY29sb3IgPSAnIzAwMCcsIHRoaWNrbmVzcyA9IDF9ID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMueHlzID0geHlzO1xuXHRcdHRoaXMuY2xvc2VkID0gY2xvc2VkO1xuXHRcdHRoaXMuZmlsbCA9IGZpbGw7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzO1xuXHR9XG5cblx0cGFpbnQoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0aWYgKHRoaXMuZmlsbCkge1xuXHRcdFx0dGhpcy5zZXRGaWxsTW9kZShjb250ZXh0KTtcblx0XHRcdHRoaXMucGFpbnRQYXRoKHh0LCB5dCwgY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LmZpbGwoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5zZXRMaW5lTW9kZShjb250ZXh0KTtcblx0XHRcdHRoaXMucGFpbnRQYXRoKHh0LCB5dCwgY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LnN0cm9rZSgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5maWxsID09PSAnZG91YmxlJykge1xuXHRcdFx0dGhpcy5zZXREb3VibGVNb2RlKGNvbnRleHQpO1xuXHRcdFx0dGhpcy5wYWludFBhdGgoeHQsIHl0LCBjb250ZXh0KTtcblx0XHRcdGNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0fVxuXHR9XG5cblx0cGFpbnRQYXRoKHh0LCB5dCwgY29udGV4dCkge1xuXHRcdGNvbnRleHQuYmVnaW5QYXRoKCk7XG5cdFx0bGV0IHh5dCA9IHh5ID0+IFt4dCh4eVswXSksIHl0KHh5WzFdKV07XG5cdFx0Y29udGV4dC5tb3ZlVG8oLi4ueHl0KHRoaXMueHlzWzBdKSk7XG5cdFx0dGhpcy54eXMuZm9yRWFjaCh4eSA9PlxuXHRcdFx0Y29udGV4dC5saW5lVG8oLi4ueHl0KHh5KSkpO1xuXHRcdGlmICh0aGlzLmNsb3NlZClcblx0XHRcdGNvbnRleHQuY2xvc2VQYXRoKCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYXRoO1xuIiwiY29uc3QgUGFpbnRlckVsZW1lbnQgPSByZXF1aXJlKCcuL1BhaW50ZXJFbGVtZW50Jyk7XG5cbmNsYXNzIFJlY3QgZXh0ZW5kcyBQYWludGVyRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIHtmaWxsLCBjb2xvciA9ICcjMDAwJywgdGhpY2tuZXNzID0gMX0gPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0XHR0aGlzLmZpbGwgPSBmaWxsO1xuXHRcdHRoaXMuY29sb3IgPSBjb2xvcjtcblx0XHR0aGlzLnRoaWNrbmVzcyA9IHRoaWNrbmVzcztcblx0fVxuXG5cdHN0YXRpYyB3aXRoQ2FtZXJhKGNhbWVyYSwgeCwgeSwgd2lkdGgsIGhlaWdodCwge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9ID0ge30pIHtcblx0XHRyZXR1cm4gbmV3IFJlY3QoY2FtZXJhLnh0KHgpLCBjYW1lcmEueXQoeSksIGNhbWVyYS5zdCh3aWR0aCksIGNhbWVyYS5zdChoZWlnaHQpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxuXG5cdHBhaW50KHh0LCB5dCwgY29udGV4dCkge1xuXHRcdGxldCB0eCA9IHh0KHRoaXMueCk7XG5cdFx0bGV0IHR5ID0geXQodGhpcy55KTtcblx0XHRsZXQgdFdpZHRoID0geHQodGhpcy53aWR0aCk7XG5cdFx0bGV0IHRIZWlnaHQgPSB4dCh0aGlzLmhlaWdodCk7XG5cblx0XHRpZiAodGhpcy5maWxsKSB7XG5cdFx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdFx0Y29udGV4dC5maWxsUmVjdCh0eCwgdHksIHRXaWR0aCwgdEhlaWdodCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2V0TGluZU1vZGUoY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LnN0cm9rZVJlY3QodHgsIHR5LCB0V2lkdGgsIHRIZWlnaHQpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7XG4iLCJjb25zdCBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0Jyk7XG5cbmNsYXNzIFJlY3RDIGV4dGVuZHMgUmVjdCB7XG5cdC8vIHRvZG8gW2xvd10gcmVmYWN0b3IgY29vcmRpbmF0ZSBzeXN0ZW0gdG8gc3VwcG9ydCBjb29yZGludGFlcywgY2VudGVyZWQgY29vcmRpbnRhZXMsIGFuZCBjYW1lcmEgY29vcmRpbnRhZXMgdG8gcmVwbGFjZSBjdXJyZW50IGNvbnN0cnVjdG9yIG92ZXJsb2FkaW5nXG5cdGNvbnN0cnVjdG9yKGNlbnRlclgsIGNlbnRlclksIHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcihjZW50ZXJYIC0gd2lkdGggLyAyLCBjZW50ZXJZIC0gaGVpZ2h0IC8gMiwgd2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG5cblx0c3RhdGljIHdpdGhDYW1lcmEoY2FtZXJhLCBjZW50ZXJYLCBjZW50ZXJZLCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdHJldHVybiBuZXcgUmVjdEMoY2FtZXJhLnh0KGNlbnRlclgpLCBjYW1lcmEueXQoY2VudGVyWSksIGNhbWVyYS5zdCh3aWR0aCksIGNhbWVyYS5zdChoZWlnaHQpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3RDO1xuIiwiY29uc3QgUGFpbnRlckVsZW1lbnQgPSByZXF1aXJlKCcuL1BhaW50ZXJFbGVtZW50Jyk7XG5cbmNsYXNzIFRleHQgZXh0ZW5kcyBQYWludGVyRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHRleHQsIHtjb2xvciA9ICcjMDAwJywgc2l6ZSA9ICcxOHB4JywgYWxpZ24gPSAnY2VudGVyJ30gPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMudGV4dCA9IHRleHQ7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5hbGlnbiA9IGFsaWduO1xuXHR9XG5cblx0cGFpbnQoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0dGhpcy5zZXRGaWxsTW9kZShjb250ZXh0KTtcblx0XHR0aGlzLnNldEZvbnQoY29udGV4dCk7XG5cblx0XHRsZXQgdHggPSB4dCh0aGlzLngpO1xuXHRcdGxldCB0eSA9IHl0KHRoaXMueSk7XG5cdFx0Y29udGV4dC5maWxsVGV4dCh0aGlzLnRleHQsIHR4LCB0eSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0O1xuIiwiY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3Qge3JhbmQsIHJhbmRJbnR9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jb25zdCBGTElDS0VSX0NPTE9SX01VTFQgPSAuNztcbmNvbnN0IFNUQVJfQ09MT1JfQVJSQVkgPSBbXG5cdFtDb2xvcnMuU3Rhci5XSElURSwgQ29sb3JzLlN0YXIuV0hJVEUubXVsdGlwbHkoRkxJQ0tFUl9DT0xPUl9NVUxUKV0sXG5cdFtDb2xvcnMuU3Rhci5CTFVFLCBDb2xvcnMuU3Rhci5CTFVFLm11bHRpcGx5KEZMSUNLRVJfQ09MT1JfTVVMVCldXTtcblxuY2xhc3MgU3RhciB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHosIHNpemUsIGJsdWUpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy56ID0gejtcblx0XHR0aGlzLnNpemUgPSBzaXplO1xuXHRcdHRoaXMuYmx1ZSA9IGJsdWU7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRjb25zdCBGTElDS0VSX1JBVEUgPSAuMDAzO1xuXG5cdFx0bGV0IHggPSBjYW1lcmEueHQodGhpcy54LCB0aGlzLnopO1xuXHRcdGxldCB5ID0gY2FtZXJhLnl0KHRoaXMueSwgdGhpcy56KTtcblx0XHRsZXQgcyA9IGNhbWVyYS5zdCh0aGlzLnNpemUsIHRoaXMueik7XG5cblx0XHRpZiAodGhpcy5mbGlja2VyKVxuXHRcdFx0dGhpcy5mbGlja2VyLS07XG5cdFx0ZWxzZSBpZiAocmFuZCgpIDwgRkxJQ0tFUl9SQVRFKVxuXHRcdFx0dGhpcy5mbGlja2VyID0gcmFuZEludCg3NSk7XG5cblx0XHRsZXQgY29sb3IgPSBTVEFSX0NPTE9SX0FSUkFZW3RoaXMuYmx1ZSA/IDEgOiAwXVt0aGlzLmZsaWNrZXIgPyAxIDogMF07XG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3RDKHgsIHksIHMsIHMsIHtmaWxsOiB0cnVlLCBjb2xvcjogY29sb3IuZ2V0KCl9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyO1xuIiwiY29uc3Qge3JhbmQsIHJhbmRCfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBTdGFyID0gcmVxdWlyZSgnLi9TdGFyJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgU3RhcmZpZWxkIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZXh0cmEgPSAwKSB7XG5cdFx0Y29uc3QgREVQVEggPSAyMCArIGV4dHJhICogMjAsIEZPUldBUkRfREVQVEggPSAuOCxcblx0XHRcdFdJRFRIID0gd2lkdGggKiBERVBUSCwgSEVJR0hUID0gaGVpZ2h0ICogREVQVEgsXG5cdFx0XHRDT1VOVCA9IFdJRFRIICogSEVJR0hULFxuXHRcdFx0U0laRSA9IC4wNSArIGV4dHJhICogLjA1LCBCTFVFX1JBVEUgPSAuMDU7XG5cblx0XHR0aGlzLnN0YXJzID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBDT1VOVDsgaSsrKSB7XG5cdFx0XHRsZXQgeCA9IHJhbmRCKFdJRFRIKTtcblx0XHRcdGxldCB5ID0gcmFuZEIoSEVJR0hUKTtcblx0XHRcdGxldCB6ID0gcmFuZChERVBUSCkgLSBGT1JXQVJEX0RFUFRIO1xuXHRcdFx0aWYgKHggPiB6IHx8IHggPCAteiB8fCB5ID4geiB8fCB5IDwgLXopXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0bGV0IHNpemUgPSByYW5kKFNJWkUpO1xuXHRcdFx0dGhpcy5zdGFycy5wdXNoKG5ldyBTdGFyKHgsIHksIHosIHNpemUsIHJhbmQoKSA8IEJMVUVfUkFURSkpO1xuXHRcdH1cblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdC8vIHBhaW50ZXIuYWRkKG5ldyBSZWN0QyguNSwgLjUsIDEsIDEsIHtmaWxsOiB0cnVlfSkpO1xuXHRcdHRoaXMuc3RhcnMuZm9yRWFjaChzdGFyID0+IHN0YXIucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyZmllbGQ7XG4iLCJjb25zdCBTdGFyZmllbGQgPSByZXF1aXJlKCcuL1N0YXJmaWVsZCcpO1xuY29uc3Qge05vaXNlU2ltcGxleH0gPSByZXF1aXJlKCcuLi91dGlsL05vaXNlJyk7XG5jb25zdCB7cmFuZH0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuY29uc3QgU3RhciA9IHJlcXVpcmUoJy4vU3RhcicpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbi8vIHRoaXMgY2xhc3MgaXMgb25seSBmb3IgdGhlIFN0YXJmaWVsZERlbW9cbmNsYXNzIFN0YXJmaWVsZE5vaXNlIGV4dGVuZHMgU3RhcmZpZWxkIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZXh0cmEgPSAwKSB7XG5cdFx0c3VwZXIoMCwgMCwgMCk7XG5cblx0XHRjb25zdCBERVBUSCA9IDIwICsgZXh0cmEgKiAyMCwgRk9SV0FSRF9ERVBUSCA9IC44LFxuXHRcdFx0V0lEVEggPSB3aWR0aCAqIERFUFRILCBIRUlHSFQgPSBoZWlnaHQgKiBERVBUSCxcblx0XHRcdENPVU5UID0gMTAgKiBXSURUSCAqIEhFSUdIVCxcblx0XHRcdFNJWkUgPSAuMDMgKyBleHRyYSAqIC4wMywgQkxVRV9SQVRFID0gLjA1O1xuXG5cdFx0bGV0IG5vaXNlID0gbmV3IE5vaXNlU2ltcGxleCg4KTtcblxuXHRcdHRoaXMuc3RhcnMgPSBub2lzZS5wb3NpdGlvbnMoQ09VTlQsIFdJRFRILCBIRUlHSFQpLm1hcCgoW3gsIHldKSA9PiB7XG5cdFx0XHR4IC09IFdJRFRIIC8gMjtcblx0XHRcdHkgLT0gSEVJR0hUIC8gMjtcblx0XHRcdGxldCB6ID0gcmFuZChERVBUSCk7XG5cdFx0XHRpZiAoeCA+IHogfHwgeCA8IC16IHx8IHkgPiB6IHx8IHkgPCAteilcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRsZXQgc2l6ZSA9IHJhbmQoU0laRSk7XG5cdFx0XHRyZXR1cm4gbmV3IFN0YXIoeCwgeSwgeiwgc2l6ZSwgcmFuZCgpIDwgQkxVRV9SQVRFKTtcblx0XHR9KS5maWx0ZXIoc3RhciA9PiBzdGFyKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXJmaWVsZE5vaXNlO1xuIiwiY29uc3Qge2NsYW1wfSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNvbnN0IFNIQURFX0FERCA9IDE7XG5cbmNsYXNzIENvbG9yIHtcblx0Y29uc3RydWN0b3IociwgZywgYiwgYSA9IDEpIHtcblx0XHR0aGlzLnIgPSBjbGFtcChyLCAwLCAyNTUpO1xuXHRcdHRoaXMuZyA9IGNsYW1wKGcsIDAsIDI1NSk7XG5cdFx0dGhpcy5iID0gY2xhbXAoYiwgMCwgMjU1KTtcblx0XHR0aGlzLmEgPSBjbGFtcChhLCAwLCAxKTtcblx0XHR0aGlzLnN0cmluZyA9IGByZ2JhKCR7dGhpcy5yfSwgJHt0aGlzLmd9LCAke3RoaXMuYn0sICR7dGhpcy5hfSlgO1xuXHR9XG5cblx0c3RhdGljIGZyb20yNTUociwgZywgYiwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IociwgZywgYiwgYSk7XG5cdH1cblxuXHRzdGF0aWMgZnJvbTEocjEsIGcxLCBiMSwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IoLi4uW3IxLCBnMSwgYjFdLm1hcChDb2xvci5vbmVUbzI1NSksIGEpO1xuXHR9XG5cblx0c3RhdGljIGZyb21IZXgocmgsIGdoLCBiaCwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IoLi4uW3JoLCBnaCwgYmhdLm1hcChDb2xvci5oZXhUbzI1NSksIGEpXG5cdH1cblxuXHRzdGF0aWMgZnJvbUhleFN0cmluZyhoZXgpIHtcblx0XHRpZiAoaGV4WzBdID09PSAnIycpXG5cdFx0XHRoZXggPSBoZXguc3Vic3RyKDEpO1xuXG5cdFx0aWYgKGhleC5sZW5ndGggPT09IDMpXG5cdFx0XHRyZXR1cm4gQ29sb3IuZnJvbTI1NShcblx0XHRcdFx0Q29sb3IuaGV4VG8yNTUocGFyc2VJbnQoaGV4WzBdLCAxNikpLFxuXHRcdFx0XHRDb2xvci5oZXhUbzI1NShwYXJzZUludChoZXhbMV0sIDE2KSksXG5cdFx0XHRcdENvbG9yLmhleFRvMjU1KHBhcnNlSW50KGhleFsyXSwgMTYpKSk7XG5cblx0XHRyZXR1cm4gQ29sb3IuZnJvbTI1NShcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoMCwgMiksIDE2KSxcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoMiwgMiksIDE2KSxcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoNCwgMiksIDE2KSk7XG5cdH1cblxuXHRtdWx0aXBseShtdWx0KSB7XG5cdFx0cmV0dXJuIG5ldyBDb2xvcih0aGlzLnIgKiBtdWx0LCB0aGlzLmcgKiBtdWx0LCB0aGlzLmIgKiBtdWx0LCB0aGlzLmEpO1xuXHR9XG5cblx0YWxwaGFNdWx0aXBseShtdWx0KSB7XG5cdFx0cmV0dXJuIG5ldyBDb2xvcih0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCB0aGlzLmEgKiBtdWx0KTtcblx0fVxuXG5cdGF2Z1doaXRlKHdlaWdodCA9IC41KSB7XG5cdFx0bGV0IGl3ZWlnaHQgPSAxIC0gd2VpZ2h0O1xuXHRcdHJldHVybiBuZXcgQ29sb3IoXG5cdFx0XHR0aGlzLnIgKiBpd2VpZ2h0ICsgd2VpZ2h0ICogMjU1LFxuXHRcdFx0dGhpcy5nICogaXdlaWdodCArIHdlaWdodCAqIDI1NSxcblx0XHRcdHRoaXMuYiAqIGl3ZWlnaHQgKyB3ZWlnaHQgKiAyNTUsXG5cdFx0XHR0aGlzLmEpO1xuXHR9XG5cblx0Z2V0KCkge1xuXHRcdHJldHVybiB0aGlzLnN0cmluZztcblx0fVxuXG5cdC8vIHNoYWRlIHNob3VsZCBiZSAwIChubyBzaGFkaW5nKSB0byAxIChtYXhpbXVtIHNoYWRpbmcpXG5cdGdldFNoYWRlKHNoYWRlID0gMSkge1xuXHRcdGlmIChzaGFkZSA9PT0gMSlcblx0XHRcdHJldHVybiB0aGlzLnNoYWRlU3RyaW5nIHx8ICh0aGlzLnNoYWRlU3RyaW5nID0gdGhpcy5tdWx0aXBseSgxICsgU0hBREVfQUREKS5nZXQoKSk7XG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkoMSArIFNIQURFX0FERCAqIHNoYWRlKS5nZXQoKTtcblx0fVxuXG5cdGdldEFscGhhKGFscGhhTXVsdCA9IDEpIHtcblx0XHRjb25zdCBOT19DT0xPUiA9IENvbG9yLmZyb20xKDAsIDAsIDAsIDApO1xuXHRcdGlmIChhbHBoYU11bHQgPT09IDEpXG5cdFx0XHRyZXR1cm4gdGhpcy5zdHJpbmc7XG5cdFx0aWYgKGFscGhhTXVsdCA9PT0gMClcblx0XHRcdHJldHVybiBOT19DT0xPUi5nZXQoKTtcblx0XHRyZXR1cm4gdGhpcy5hbHBoYU11bHRpcGx5KGFscGhhTXVsdCkuZ2V0KCk7XG5cdH1cblxuXHRzdGF0aWMgaGV4VG8yNTUoaGV4KSB7XG5cdFx0cmV0dXJuIGhleCAqIDE3XG5cdH1cblxuXHRzdGF0aWMgb25lVG8yNTUob25lKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KG9uZSAqIDI1NSk7XG5cdH1cbn1cblxuQ29sb3IuV0hJVEUgPSBDb2xvci5mcm9tMSgwLCAwLCAwKTtcbkNvbG9yLkJMQUNLID0gQ29sb3IuZnJvbTEoMCwgMCwgMCk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG4iLCJjb25zdCBDb2xvciA9IHJlcXVpcmUoJy4vQ29sb3InKTtcblxuY29uc3QgQ29sb3JzID0ge1xuXHQvLyB0b2RvIFttZWRpdW1dIHN0cnVjdHVyZSB0aGVzZSBjb25zdGFudHNcblxuXHQvLyBiYXJzXG5cdEJBUl9TSEFESU5HOiAuMjUsXG5cdExJRkU6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNmYWI5YjEnKS5hdmdXaGl0ZSguMjUpLFxuXHRTVEFNSU5BOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjOThkNDk0JykuYXZnV2hpdGUoLjQpLFxuXHRFTlJBR0U6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM2MTY2MDAnKSxcblxuXHRUQVJHRVRfTE9DSzogQ29sb3IuZnJvbTEoLjUsIC41LCAuNSksXG5cdERBTUFHRTogQ29sb3IuZnJvbTI1NSgyNTUsIDAsIDAsIC40KSxcblxuXHQvLyBhYmlsaXRpZXNcblx0UExBWUVSX0FCSUxJVElFUzogW1xuXHRcdENvbG9yLmZyb21IZXhTdHJpbmcoJyNhODc2NzYnKS5hdmdXaGl0ZSguNCksXG5cdFx0Q29sb3IuZnJvbUhleFN0cmluZygnIzc2YTg3NicpLmF2Z1doaXRlKC40KSxcblx0XHRDb2xvci5mcm9tSGV4U3RyaW5nKCcjNzY3NmE4JykuYXZnV2hpdGUoLjQpLFxuXHRcdENvbG9yLmZyb21IZXhTdHJpbmcoJyM3NmE2YTYnKS5hdmdXaGl0ZSguNCksXG5cdFx0Q29sb3IuZnJvbUhleFN0cmluZygnI2E2NzZhNicpLmF2Z1doaXRlKC40KSxcblx0XHRDb2xvci5mcm9tSGV4U3RyaW5nKCcjYTZhNjc2JykuYXZnV2hpdGUoLjQpLFxuXHRdLFxuXHRQTEFZRVJfQUJJTElUWV9OT1RfUkVBRFk6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM0NDQnKSxcblxuXHRJbnRlcmZhY2U6IHtcblx0XHRJTkFDVElWRTogQ29sb3IuZnJvbTEoMSwgMSwgMSksXG5cdFx0SE9WRVI6IENvbG9yLmZyb20xKC45NSwgLjk1LCAuOTUpLFxuXHRcdEFDVElWRTogQ29sb3IuZnJvbTEoMSwgMSwgMSlcblx0fSxcblxuXHRFbnRpdHk6IHtcblx0XHRNQVBfQk9VTkRBUlk6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNjY2MnKSxcblx0XHRST0NLOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjODg4JyksXG5cdFx0Uk9DS19NSU5FUkFMOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjOGI4JyksXG5cdFx0UExBWUVSOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjODg4JyksXG5cdFx0TU9OU1RFUjogQ29sb3IuZnJvbUhleFN0cmluZygnI2JkNjM1OScpLFxuXHRcdEhPU1RJTEVfUFJPSkVDVElMRTogQ29sb3IuZnJvbUhleFN0cmluZygnI2M2NicpLFxuXHRcdEZSSUVORExZX1BST0pFQ1RJTEU6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM2YzYnKSxcblx0XHRCb21iOiB7XG5cdFx0XHRXQVJOSU5HX0JPUkRFUjogQ29sb3IuZnJvbUhleFN0cmluZygnI2NjOGY1MicpLFxuXHRcdFx0RU5USVRZOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjMDBjJylcblx0XHR9LFxuXHRcdEFSRUFfREVHRU46IHtcblx0XHRcdFdBUk5JTkdfQk9SREVSOiBDb2xvci5mcm9tMSgxLCAwLCAwKSxcblx0XHRcdEFDVElWRV9GSUxMOiBDb2xvci5mcm9tMSguOCwgMCwgMCwgLjEpXG5cdFx0fSxcblx0XHREVVNUOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjY2NjJyksXG5cdFx0REFNQUdFX0RVU1Q6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNmODgnKVxuXHR9LFxuXG5cdE1vbnN0ZXJzOiB7XG5cdFx0T3V0cG9zdFBvcnRhbDoge1xuXHRcdFx0RklMTDogQ29sb3IuZnJvbTEoMSwgLjksIC45KSxcblx0XHRcdEJPUkRFUjogQ29sb3IuZnJvbTEoMSwgLjUsIC41KSxcblx0XHRcdExJTkVTOiBDb2xvci5mcm9tMSgxLCAuOTUsIC45NSksXG5cdFx0fVxuXHR9LFxuXG5cdFN0YXI6IHtcblx0XHRXSElURTogQ29sb3IuZnJvbTEoLjcsIC43LCAuNyksXG5cdFx0QkxVRTogQ29sb3IuZnJvbTEoLjUsIC41LCAuNzUpXG5cdH0sXG5cblx0TWluaW1hcDoge1xuXHRcdEJBQ0tHUk9VTkQ6IENvbG9yLmZyb20xKDEsIDEsIDEsIC41KSxcblx0XHRCT1JERVI6IENvbG9yLmZyb20xKDAsIDAsIDAsIC41KSxcblx0XHRST0NLOiBDb2xvci5mcm9tMSgwLCAwLCAwKSxcblx0XHRNT05TVEVSOiBDb2xvci5mcm9tMSgxLCAwLCAwKSxcblx0XHRCT1NTOiBDb2xvci5mcm9tMSgxLCAwLCAuNiksXG5cdFx0UExBWUVSOiBDb2xvci5mcm9tMSgwLCAwLCAxKVxuXHR9XG59O1xuXG5jb25zdCBQb3NpdGlvbnMgPSB7XG5cdE1BUkdJTjogLjAyLFxuXHRCQVJfSEVJR0hUOiAuMDIsXG5cdFBMQVlFUl9CQVJfWDogLjUsXG5cdEFCSUxJVFlfU0laRTogLjA2LFxuXHRBQklMSVRZX0NIQU5ORUxfQkFSX1NJWkU6IC4wMSxcblx0U1RBR0VfVEVYVF9IRUlHSFQ6IC4wMyxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge0NvbG9ycywgUG9zaXRpb25zfTtcblxuLy8gTm90ZXNcblxuLy8gU0hJRUxEX0NPTE9SOiBDb2xvci5mcm9tMSguNCwgLjUsIC43KSxcbi8vIFJFU0VSVkVfQ09MT1I6IENvbG9yLmZyb20xKC4yLCAuNiwgLjYpLFxuLy8gRVhQRVJJRU5DRV9DT0xPUjogQ29sb3IuZnJvbTEoLjksIC42LCAuMSksXG5cbi8vIExJRkVfRU1QVFlfQ09MT1I6IENvbG9yLmZyb21IZXgoMHg0LCAweGIsIDB4YyksXG4vLyBMSUZFX0ZJTExfQ09MT1I6IENvbG9yLmZyb21IZXgoMHg1LCAweGQsIDB4ZiksXG4vLyBTVEFNSU5BX0VNUFRZX0NPTE9SOiBDb2xvci5mcm9tSGV4KDB4YywgMHhjLCAweDQpLFxuLy8gU1RBTUlOQV9GSUxMX0NPTE9SOiBDb2xvci5mcm9tSGV4KDB4ZiwgMHhmLCAweDUpLFxuXG4vLyBjb25zdCBsb2NhbExpZmUgPSBcIiNjYzRlNGVcIjtcbi8vIGNvbnN0IGxvY2FsU3RhbWluYSA9IFwiI2ZmY2M5OVwiO1xuLy8gY29uc3QgbG9jYWxTaGllbGQgPSBcIiM2NjgwYjNcIjtcbi8vIGNvbnN0IGxvY2FsUmVzZXJ2ZSA9IFwiIzMzOTk5OVwiO1xuLy8gY29uc3QgbG9jYWxFeHBlcmllbmNlID0gXCIjZTY5OTFhXCI7XG5cbi8vIGh0dHA6Ly9wYWxldHRvbi5jb20vI3VpZD03NUMwRjBrait6WjlYUnRmdUl2bzB1bHNKcWZcblxuLy8gdG9kbyBbbG93XSBmaW5kIHByZXR0aWVyIGNvbG9yc1xuIiwiY2xhc3MgRGVjYXkge1xuXHRjb25zdHJ1Y3RvcihtYXgsIGRlY2F5UmF0ZSkge1xuXHRcdHRoaXMubWF4ID0gbWF4O1xuXHRcdHRoaXMuZGVjYXlSYXRlID0gZGVjYXlSYXRlO1xuXHRcdHRoaXMudmFsdWUgPSAwO1xuXHR9XG5cblx0YWRkKGFtb3VudCkge1xuXHRcdGlmIChhbW91bnQgPiAwKVxuXHRcdFx0dGhpcy52YWx1ZSA9IE1hdGgubWluKHRoaXMudmFsdWUgKyBhbW91bnQsIHRoaXMubWF4ICsgdGhpcy5kZWNheVJhdGUpO1xuXHR9XG5cblx0ZGVjYXkoKSB7XG5cdFx0aWYgKHRoaXMudmFsdWUgPiAwKVxuXHRcdFx0dGhpcy52YWx1ZSA9IE1hdGgubWF4KHRoaXMudmFsdWUgLSB0aGlzLmRlY2F5UmF0ZSwgMCk7XG5cdH1cblxuXHRnZXQoKSB7XG5cdFx0cmV0dXJuIHRoaXMudmFsdWUgLyB0aGlzLm1heDtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlY2F5O1xuIiwiY29uc3QgbWFrZUVudW0gPSAoLi4udmFsdWVzKSA9PiB7XG5cdGxldCBlbnVtYiA9IHt9O1xuXHR2YWx1ZXMuZm9yRWFjaCgodmFsdWUsIGluZGV4KSA9PiBlbnVtYlt2YWx1ZV0gPSBpbmRleCk7XG5cdHJldHVybiBlbnVtYjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWFrZUVudW07XG4iLCJjb25zdCB7cm91bmR9ID0gcmVxdWlyZSgnLi9OdW1iZXInKTtcblxuY2xhc3MgRnBzVHJhY2tlciB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMuZnBzID0gMDtcblx0fVxuXG5cdHRpY2soKSB7XG5cdFx0bGV0IG5vdyA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdGxldCBwYXNzZWQgPSBub3cgLSB0aGlzLnN0YXJ0O1xuXHRcdGlmICghKHBhc3NlZCA8IDEwMDApKSB7XG5cdFx0XHR0aGlzLnN0YXJ0ID0gbm93O1xuXHRcdFx0dGhpcy5mcHMgPSB0aGlzLnRpY2tzICogMTAwMCAvIHBhc3NlZDtcblx0XHRcdHRoaXMudGlja3MgPSAwO1xuXHRcdH1cblx0XHR0aGlzLnRpY2tzKys7XG5cdH1cblxuXHRnZXRGcHMoKSB7XG5cdFx0dGhpcy50aWNrKCk7XG5cdFx0cmV0dXJuIHJvdW5kKHRoaXMuZnBzKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZwc1RyYWNrZXI7XG4iLCJjbGFzcyBJdGVtIHtcbiAgICBjb25zdHJ1Y3Rvcih2YWx1ZSwgcHJldikge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMucHJldiA9IHByZXY7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEl0ZW07XG4iLCJjb25zdCBJdGVtID0gcmVxdWlyZSgnLi9JdGVtJyk7XG5cbmNsYXNzIExpbmtlZExpc3Qge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmxlbmd0aCA9IDA7XG5cdH1cblxuXHRhZGQodmFsdWUpIHtcblx0XHR0aGlzLmxlbmd0aCsrO1xuXHRcdHJldHVybiAhdGhpcy5oZWFkXG5cdFx0XHQ/IHRoaXMudGFpbCA9IHRoaXMuaGVhZCA9IG5ldyBJdGVtKHZhbHVlKVxuXHRcdFx0OiB0aGlzLnRhaWwgPSB0aGlzLnRhaWwubmV4dCA9IG5ldyBJdGVtKHZhbHVlLCB0aGlzLnRhaWwpO1xuXHR9XG5cblx0cmVtb3ZlKGl0ZW0pIHtcblx0XHR0aGlzLmxlbmd0aC0tO1xuXHRcdGlmIChpdGVtLnByZXYpXG5cdFx0XHRpdGVtLnByZXYubmV4dCA9IGl0ZW0ubmV4dDtcblx0XHRpZiAoaXRlbS5uZXh0KVxuXHRcdFx0aXRlbS5uZXh0LnByZXYgPSBpdGVtLnByZXY7XG5cdFx0aWYgKHRoaXMuaGVhZCA9PT0gaXRlbSlcblx0XHRcdHRoaXMuaGVhZCA9IGl0ZW0ubmV4dDtcblx0XHRpZiAodGhpcy50YWlsID09PSBpdGVtKVxuXHRcdFx0dGhpcy50YWlsID0gaXRlbS5wcmV2O1xuXHR9XG5cblx0Zm9yRWFjaChoYW5kbGVyKSB7XG5cdFx0bGV0IGl0ZXIgPSB0aGlzLmhlYWQ7XG5cdFx0d2hpbGUgKGl0ZXIpIHtcblx0XHRcdGhhbmRsZXIoaXRlci52YWx1ZSwgaXRlcik7XG5cdFx0XHRpdGVyID0gaXRlci5uZXh0O1xuXHRcdH1cblx0fVxuXG5cdGZpbHRlcihoYW5kbGVyKSB7XG5cdFx0bGV0IG91dHB1dCA9IFtdO1xuXHRcdGxldCBpdGVyID0gdGhpcy5oZWFkO1xuXHRcdHdoaWxlIChpdGVyKSB7XG5cdFx0XHRpZiAoaGFuZGxlcihpdGVyLnZhbHVlLCBpdGVyKSlcblx0XHRcdFx0b3V0cHV0LnB1c2goaXRlcik7XG5cdFx0XHRpdGVyID0gaXRlci5uZXh0O1xuXHRcdH1cblx0XHRyZXR1cm4gb3V0cHV0O1xuXHR9XG5cblx0ZmluZChoYW5kbGVyKSB7XG5cdFx0bGV0IGl0ZXIgPSB0aGlzLmhlYWQ7XG5cdFx0d2hpbGUgKGl0ZXIpIHtcblx0XHRcdGlmIChoYW5kbGVyKGl0ZXIudmFsdWUsIGl0ZXIpKVxuXHRcdFx0XHRyZXR1cm4gaXRlcjtcblx0XHRcdGl0ZXIgPSBpdGVyLm5leHQ7XG5cdFx0fVxuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlua2VkTGlzdDtcbiIsImNvbnN0IFNpbXBsZXhOb2lzZSA9IHJlcXVpcmUoJ3NpbXBsZXgtbm9pc2UnKTtcblxuY29uc3Qge0VQU0lMT04sIGdldE1hZ25pdHVkZSwgcmFuZH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xuXG5jbGFzcyBOb2lzZVNpbXBsZXgge1xuXHRjb25zdHJ1Y3RvcihzY2FsZSA9IDEwLCB0aHJlc2hvbGQgPSAuNSwgdGhyZXNob2xkUmFuZFdlaWdodCA9IDEpIHtcblx0XHR0aGlzLnNjYWxlID0gc2NhbGU7XG5cdFx0dGhpcy50aHJlc2hvbGQgPSB0aHJlc2hvbGQ7XG5cdFx0dGhpcy50aHJlc2hvbGRSYW5kV2VpZ2h0ID0gdGhyZXNob2xkUmFuZFdlaWdodDtcblx0XHR0aGlzLnNpbXBsZXhOb2lzZSA9IG5ldyBTaW1wbGV4Tm9pc2UocmFuZCk7XG5cdH1cblxuXHRnZXQoeCwgeSkge1xuXHRcdHJldHVybiB0aGlzLnNpbXBsZXhOb2lzZS5ub2lzZTJEKHggKiB0aGlzLnNjYWxlICsgMSwgeSAqIHRoaXMuc2NhbGUpICogLjUgKyAuNTsgLy8gc2VlbXMgbGlrZSBzaW1wbGV4Tm9pc2UgaW1wbGVtZW50YXRpb24gaXMgYnVnZ2VkIHRvIGFsd2F5cyByZXR1cm4gMCBhdCAoMCwgMClcblx0fVxuXG5cdC8vIG5vdCBjb25zaXN0ZW50LCBjYWxsaW5nIGl0IG11bHRpcGxlIHRpbWVzIHdpdGggc2FtZSBwYXJhbWV0ZXJzIGNhbiB5aWVsZCBkaWZmZXJlbnQgcmVzdWx0c1xuXHRnZXRCKHgsIHkpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXQoeCwgeSkgPiB0aGlzLnRocmVzaG9sZCArIHJhbmQodGhpcy50aHJlc2hvbGRSYW5kV2VpZ2h0KTtcblx0fVxuXG5cdC8vIHJldHVybiBjb3VudCBudW1iZXIgb2YgcG9zaXRpb25zIHdpdGhpbiByYW5nZSBbWzAgLSB3aWR0aF0sIFswIC0gaGVpZ2h0XV0sIHN0cnVjdHVyZWQgYXMgMmQgYXJyYXlcblx0Ly8gbm90IGNvbnNpc3RlbnQsIGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMgd2l0aCBzYW1lIHBhcmFtZXRlcnMgY2FuIHlpZWxkIGRpZmZlcmVudCByZXN1bHRzXG5cdHBvc2l0aW9ucyhjb3VudCwgd2lkdGgsIGhlaWdodCkge1xuXHRcdGxldCBwb3NpdGlvbnMgPSBbXTtcblx0XHR3aGlsZSAocG9zaXRpb25zLmxlbmd0aCA8IGNvdW50KSB7XG5cdFx0XHRsZXQgeCA9IHJhbmQoKTtcblx0XHRcdGxldCB5ID0gcmFuZCgpO1xuXHRcdFx0aWYgKHRoaXMuZ2V0Qih4LCB5KSlcblx0XHRcdFx0cG9zaXRpb25zLnB1c2goW3ggKiB3aWR0aCwgeSAqIGhlaWdodF0pO1xuXHRcdH1cblx0XHRyZXR1cm4gcG9zaXRpb25zO1xuXHR9XG5cblx0Ly8gcmV0dXJuIHBvc2l0aW9uIHdpdGggbG93ZXN0IG5vaXNlIHZhbHVlIG9mIGNvdW50IHJhbmRvbSBwb3NpdGlvbnMsIHdpdGhpbiByYW5nZSBbWzAgLSB3aWR0aF0sIFswIC0gaGVpZ2h0XV1cblx0Ly8gbm90IGNvbnNpc3RlbnQsIGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMgd2l0aCBzYW1lIHBhcmFtZXRlcnMgY2FuIHlpZWxkIGRpZmZlcmVudCByZXN1bHRzXG5cdHBvc2l0aW9uc0xvd2VzdChjb3VudCwgd2lkdGgsIGhlaWdodCkge1xuXHRcdGxldCBwb3NpdGlvbiA9IFtdO1xuXHRcdGxldCBtaW5Ob2lzZSA9IDE7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG5cdFx0XHRsZXQgeCA9IHJhbmQoKTtcblx0XHRcdGxldCB5ID0gcmFuZCgpO1xuXHRcdFx0bGV0IG5vaXNlID0gdGhpcy5nZXQoeCwgeSk7XG5cdFx0XHRpZiAobm9pc2UgPCBtaW5Ob2lzZSkge1xuXHRcdFx0XHRtaW5Ob2lzZSA9IG5vaXNlO1xuXHRcdFx0XHRwb3NpdGlvbiA9IFt4ICogd2lkdGgsIHkgKiBoZWlnaHRdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcG9zaXRpb247XG5cdH1cbn1cblxuY2xhc3MgTm9pc2VHcmFkaWVudCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMucG9pbnRzID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCAxMDAwOyBpKyspXG5cdFx0XHR0aGlzLnBvaW50cy5wdXNoKFtyYW5kKCksIHJhbmQoKSwgcmFuZCgpXSk7XG5cdH1cblxuXHRnZXQoeCwgeSkge1xuXHRcdGxldCB3ZWlnaHQgPSAwO1xuXHRcdGxldCB6ID0gMDtcblx0XHR0aGlzLnBvaW50cy5mb3JFYWNoKChbcHgsIHB5LCBwel0pID0+IHtcblx0XHRcdGxldCBkID0gZ2V0TWFnbml0dWRlKHB4IC0geCwgcHkgLSB5KTtcblx0XHRcdGQgPSAxIC8gKGQgKyBFUFNJTE9OKTtcblx0XHRcdHdlaWdodCArPSBkO1xuXHRcdFx0eiArPSBweiAqIGQ7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHogLyB3ZWlnaHQ7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7Tm9pc2VTaW1wbGV4LCBOb2lzZUdyYWRpZW50fTtcbiIsImNvbnN0IEVQU0lMT04gPSAxZS0xMCwgUEkgPSBNYXRoLlBJLCBQSTIgPSBQSSAqIDI7XG5cbmNvbnN0IG1heFdoaWNoID0gKGksIGopID0+IGkgPiBqID8gW2ksIDBdIDogW2osIDFdO1xuXG5jb25zdCBnZXREaWFtb25kRGlzdGFuY2UgPSAoeCwgeSkgPT4gTWF0aC5hYnMoeCkgKyBNYXRoLmFicyh5KTtcblxuY29uc3QgZ2V0UmVjdERpc3RhbmNlID0gKHgsIHkpID0+IE1hdGgubWF4KE1hdGguYWJzKHgpLCBNYXRoLmFicyh5KSk7XG5cbi8vIHRvZG8gW21lZF0gZGVwcmVjYXRlZFxuLy8gdG9kbyBbbWVkaXVtXSByZXBsYWNlIGdldE1hZ25pdHVkZSB1c2VzIHdpdGggZ2V0TWFnbml0dWRlU3FyIHdoZXJlIHBvc3NpYmxlXG5jb25zdCBnZXRNYWduaXR1ZGVTcXIgPSAoe3gsIHl9KSA9PiB4ICogeCArIHkgKiB5O1xuXG4vLyB0b2RvIFttZWRdIGRlcHJlY2F0ZWRcbmNvbnN0IGdldE1hZ25pdHVkZSA9ICh4LCB5KSA9PiBNYXRoLnNxcnQoZ2V0TWFnbml0dWRlU3FyKHt4LCB5fSkpO1xuXG4vLyB0b2RvIFttZWRdIGRlcHJlY2F0ZWRcbmNvbnN0IHNldE1hZ25pdHVkZSA9ICh4LCB5LCBtYWduaXR1ZGUgPSAxKSA9PiB7XG5cdGxldCBwcmV2TWFnbml0dWRlID0gZ2V0TWFnbml0dWRlKHgsIHkpO1xuXHRpZiAoIXByZXZNYWduaXR1ZGUpXG5cdFx0cmV0dXJuIHt4OiBtYWduaXR1ZGUsIHk6IDAsIHByZXZNYWduaXR1ZGV9O1xuXHRsZXQgbXVsdCA9IG1hZ25pdHVkZSAvIHByZXZNYWduaXR1ZGU7XG5cdHJldHVybiB7eDogeCAqIG11bHQsIHk6IHkgKiBtdWx0LCBwcmV2TWFnbml0dWRlfTtcbn07XG5cbmNvbnN0IGNsYW1wID0gKHgsIG1pbiwgbWF4KSA9PiB7XG5cdGlmICh4IDwgbWluKVxuXHRcdHJldHVybiBtaW47XG5cdHJldHVybiB4ID4gbWF4ID8gbWF4IDogeDtcbn07XG5cbi8vIHRvZG8gW21lZF0gZGVwcmVjYXRlZFxuY29uc3QgdGhldGFUb1ZlY3RvciA9ICh0aGV0YSwgbWFnbml0dWRlID0gMSkgPT4gW2Nvcyh0aGV0YSkgKiBtYWduaXR1ZGUsIHNpbih0aGV0YSkgKiBtYWduaXR1ZGVdO1xuXG5jb25zdCBjb3MgPSB0aGV0YSA9PiBNYXRoLmNvcyh0aGV0YSk7XG5cbmNvbnN0IHNpbiA9IHRoZXRhID0+IE1hdGguc2luKHRoZXRhKTtcblxuY29uc3QgYm9vbGVhbkFycmF5ID0gYXJyYXkgPT4gYXJyYXkuc29tZShhID0+IGEpO1xuXG5jb25zdCBhdmcgPSAoYSwgYiwgd2VpZ2h0ID0gLjUpID0+IGEgKiB3ZWlnaHQgKyBiICogKDEgLSB3ZWlnaHQpO1xuXG4vLyBbMCwgaW50KVxuY29uc3QgcmFuZCA9IChtYXggPSAxKSA9PiBNYXRoLnJhbmRvbSgpICogbWF4O1xuXG5jb25zdCByYW5kQiA9IChtYXggPSAxKSA9PiByYW5kKG1heCkgLSBtYXggLyAyO1xuXG4vLyBbMCwgbWF4KVxuY29uc3QgcmFuZEludCA9IG1heCA9PiBNYXRoLmZsb29yKHJhbmQobWF4KSk7XG5cbi8vIHRvZG8gW21lZF0gZGVwcmVjYXRlZFxuY29uc3QgcmFuZFZlY3RvciA9IG1hZ25pdHVkZSA9PlxuXHR0aGV0YVRvVmVjdG9yKHJhbmQoUEkyKSwgcmFuZChtYWduaXR1ZGUpKTtcblxuLy8gdG9kbyBbbWVkXSBkZXByZWNhdGVkXG5jb25zdCB2ZWN0b3JEZWx0YSA9IChhLCBiKSA9PiAoe3g6IGIueCAtIGEueCwgeTogYi55IC0gYS55fSk7XG5cbi8vIHRvZG8gW21lZF0gZGVwcmVjYXRlZFxuY29uc3QgdmVjdG9yU3VtID0gKC4uLnZzKSA9PlxuXHR2cy5yZWR1Y2UoKHYsIHN1bSkgPT4gKHt4OiBzdW0ueCArIHYueCwgeTogc3VtLnkgKyB2Lnl9KSwge3g6IDAsIHk6IDB9KTtcblxuY29uc3Qgcm91bmQgPSAobnVtYmVyLCBwcmVjaXNpb24gPSAwKSA9PiB7XG5cdGxldCB0ZW4gPSAxMCAqKiBwcmVjaXNpb247XG5cdHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIHRlbikgLyB0ZW47XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0RVBTSUxPTixcblx0UEksXG5cdFBJMixcblx0bWF4V2hpY2gsXG5cdGdldERpYW1vbmREaXN0YW5jZSxcblx0Z2V0UmVjdERpc3RhbmNlLFxuXHRnZXRNYWduaXR1ZGVTcXIsXG5cdGdldE1hZ25pdHVkZSxcblx0c2V0TWFnbml0dWRlLFxuXHRjbGFtcCxcblx0dGhldGFUb1ZlY3Rvcixcblx0Y29zLFxuXHRzaW4sXG5cdGJvb2xlYW5BcnJheSxcblx0YXZnLFxuXHRyYW5kLFxuXHRyYW5kQixcblx0cmFuZEludCxcblx0cmFuZFZlY3Rvcixcblx0dmVjdG9yRGVsdGEsXG5cdHZlY3RvclN1bSxcblx0cm91bmQsXG59O1xuXG4vLyB0b2RvIFttZWRpdW1dIGNvbnNpc3RlbnQgcmV0dXJuIHt4LCB5fSBmb3IgdmVjdG9ycyBpbnN0ZWFkIG9mIFt4LCB5XSBmb3Igc29tZVxuLy8gdG9kbyBbbWVkaXVtXSBjb25zaXN0ZW50IGlucHV0ICh7eCwgeX0pIGZvciB2ZWN0b3JzIGluc3RlYWQgb2YgKHgsIHkpXG4iLCJjb25zdCB7cmFuZEludH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xuXG5jbGFzcyBQaGFzZSB7XG5cdC8vIGR1cmF0aW9ucyBzaG91bGQgYmUgPj0gMFxuXHRjb25zdHJ1Y3RvciguLi5kdXJhdGlvbnMpIHtcblx0XHR0aGlzLmR1cmF0aW9ucyA9IGR1cmF0aW9ucztcblx0XHR0aGlzLnNldFNlcXVlbnRpYWxTdGFydFBoYXNlKDApO1xuXHRcdHRoaXMuc2V0UGhhc2UoMCk7XG5cdH1cblxuXHRzZXRTZXF1ZW50aWFsU3RhcnRQaGFzZShwaGFzZSkge1xuXHRcdHRoaXMuc2VxdWVudGlhbFN0YXJ0UGhhc2UgPSBwaGFzZTtcblx0fVxuXG5cdHNldFBoYXNlKHBoYXNlKSB7XG5cdFx0dGhpcy5waGFzZSA9IHBoYXNlO1xuXHRcdHRoaXMuZHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uc1twaGFzZV07XG5cdH1cblxuXHRzZXRSYW5kb21UaWNrKCkge1xuXHRcdHRoaXMuZHVyYXRpb24gPSByYW5kSW50KHRoaXMuZHVyYXRpb25zW3RoaXMucGhhc2VdKSArIDE7XG5cdH1cblxuXHRuZXh0UGhhc2UoKSB7XG5cdFx0dGhpcy5zZXRQaGFzZSgrK3RoaXMucGhhc2UgPCB0aGlzLmR1cmF0aW9ucy5sZW5ndGggPyB0aGlzLnBoYXNlIDogdGhpcy5zZXF1ZW50aWFsU3RhcnRQaGFzZSk7XG5cdH1cblxuXHQvLyByZXR1cm4gdHJ1ZSBpZiBwaGFzZSBlbmRzIChlLmcuLCBkdXJhdGlvbiBlcXVhbGVkIDEpXG5cdHRpY2soKSB7XG5cdFx0cmV0dXJuIHRoaXMuZHVyYXRpb24gJiYgIS0tdGhpcy5kdXJhdGlvbjtcblx0fVxuXG5cdC8vIHJldHVybiB0cnVlIGlmIHBoYXNlIGVuZHMgKHNlZSB0aWNrKCkpXG5cdC8vIGlmIHRpY2sgPSAwLCB3aWxsIHJlbWFpbiAwIGFuZCBwaGFzZSB3aWxsIG5vdCBpdGVyYXRlXG5cdHNlcXVlbnRpYWxUaWNrKCkge1xuXHRcdGlmICh0aGlzLnRpY2soKSkge1xuXHRcdFx0dGhpcy5uZXh0UGhhc2UoKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0fVxuXG5cdGlzTmV3KCkge1xuXHRcdHJldHVybiB0aGlzLmR1cmF0aW9uID09PSB0aGlzLmR1cmF0aW9uc1t0aGlzLnBoYXNlXTtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRyZXR1cm4gdGhpcy5waGFzZTtcblx0fVxuXG5cdC8vIHN0YXJ0cyBhdCAwLCBpbmNyZWFzZXMgdG8gMVxuXHRnZXRSYXRpbygpIHtcblx0XHRyZXR1cm4gMSAtIHRoaXMuZHVyYXRpb24gLyB0aGlzLmR1cmF0aW9uc1t0aGlzLnBoYXNlXTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBoYXNlO1xuIiwiY29uc3Qge2NsYW1wfSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNsYXNzIFBvb2wge1xuXHRjb25zdHJ1Y3RvcihtYXgsIGluY3JlbWVudFJhdGUgPSAwKSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMubWF4ID0gbWF4O1xuXHRcdHRoaXMuaW5jcmVtZW50UmF0ZSA9IGluY3JlbWVudFJhdGU7XG5cdH1cblxuXHQvLyByZXR1cm4gdHJ1ZSBpZiByZWFjaGVkIDAgb3IgbWF4XG5cdGluY3JlbWVudCgpIHtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2UodGhpcy5pbmNyZW1lbnRSYXRlKTtcblx0fVxuXG5cdHJlc3RvcmUoKSB7XG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMubWF4O1xuXHR9XG5cblx0Ly8gcmV0dXJuIHRydWUgaWYgcmVhY2hlZCAwIG9yIG1heFxuXHRjaGFuZ2UoYW1vdW50KSB7XG5cdFx0dGhpcy52YWx1ZSA9IGNsYW1wKHRoaXMudmFsdWUgKyBhbW91bnQsIDAsIHRoaXMubWF4KTtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSA9PT0gMCB8fCB0aGlzLnZhbHVlID09PSB0aGlzLm1heDtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZTtcblx0fVxuXG5cdGdldE1heCgpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXg7XG5cdH1cblxuXHRnZXRSYXRpbygpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSAvIHRoaXMubWF4O1xuXHR9XG5cblx0aXNGdWxsKCkge1xuXHRcdHJldHVybiB0aGlzLnZhbHVlID09PSB0aGlzLm1heDtcblx0fVxuXG5cdGlzRW1wdHkoKSB7XG5cdFx0cmV0dXJuICF0aGlzLnZhbHVlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcbiIsImNvbnN0IHtQSTIsIGNsYW1wLCBjb3MsIHNpbiwgcmFuZH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xyXG5cclxuY2xhc3MgVmVjdG9yIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHR0aGlzLnggPSB4O1xyXG5cdFx0dGhpcy55ID0geTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBmcm9tT2JqKHt4LCB5fSkge1xyXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoeCwgeSk7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgZnJvbVRoZXRhKHRoZXRhLCBtYWduaXR1ZGUgPSAxKSB7XHJcblx0XHRyZXR1cm4gbmV3IFZlY3Rvcihjb3ModGhldGEpICogbWFnbml0dWRlLCBzaW4odGhldGEpICogbWFnbml0dWRlKTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBmcm9tUmFuZChtYXhNYWduaXR1ZGUgPSAxLCBtaW5NYWduaXR1ZGUgPSAwKSB7XHJcblx0XHRyZXR1cm4gVmVjdG9yLmZyb21UaGV0YShyYW5kKFBJMiksIG1pbk1hZ25pdHVkZSArIHJhbmQobWF4TWFnbml0dWRlIC0gbWluTWFnbml0dWRlKSlcclxuXHR9XHJcblxyXG5cdGdldCBjb3B5KCkge1xyXG5cdFx0cmV0dXJuIFZlY3Rvci5mcm9tT2JqKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0YWRkKHYpIHtcclxuXHRcdHRoaXMueCArPSB2Lng7XHJcblx0XHR0aGlzLnkgKz0gdi55O1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRzdWJ0cmFjdCh2KSB7XHJcblx0XHR0aGlzLnggLT0gdi54O1xyXG5cdFx0dGhpcy55IC09IHYueTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0bmVnYXRlKCkge1xyXG5cdFx0dGhpcy54ID0gLXRoaXMueDtcclxuXHRcdHRoaXMueSA9IC10aGlzLnk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdG11bHRpcGx5KHNjYWxlKSB7XHJcblx0XHR0aGlzLnggKj0gc2NhbGU7XHJcblx0XHR0aGlzLnkgKj0gc2NhbGU7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGRvdCh2KSB7XHJcblx0XHRyZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xyXG5cdH1cclxuXHJcblx0Y3Jvc3Modikge1xyXG5cdFx0cmV0dXJuIHRoaXMueCAqIHYueSAtIHRoaXMueSAqIHYueDtcclxuXHR9XHJcblxyXG5cdGdldCBtYWduaXR1ZGVTcXIoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55O1xyXG5cdH1cclxuXHJcblx0Z2V0IG1hZ25pdHVkZSgpIHtcclxuXHRcdHJldHVybiBNYXRoLnNxcnQodGhpcy5tYWduaXR1ZGVTcXIpO1xyXG5cdH1cclxuXHJcblx0c2V0IG1hZ25pdHVkZShtYWduaXR1ZGUpIHtcclxuXHRcdGxldCBwcmV2TWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGU7XHJcblx0XHRpZiAoIXByZXZNYWduaXR1ZGUpIHtcclxuXHRcdFx0dGhpcy54ID0gbWFnbml0dWRlO1xyXG5cdFx0XHR0aGlzLnkgPSAwO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bGV0IG11bHQgPSBtYWduaXR1ZGUgLyBwcmV2TWFnbml0dWRlO1xyXG5cdFx0XHR0aGlzLm11bHRpcGx5KG11bHQpO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHByZXZNYWduaXR1ZGU7XHJcblx0fVxyXG5cclxuXHQvLyByb3RhdGVzIGNsb2Nrd2lzZVxyXG5cdHJvdGF0ZUJ5Q29zU2luKGNvcywgc2luKSB7XHJcblx0XHRsZXQgdGVtcFggPSB0aGlzLng7XHJcblx0XHR0aGlzLnggPSB0aGlzLnggKiBjb3MgLSB0aGlzLnkgKiBzaW47XHJcblx0XHR0aGlzLnkgPSB0ZW1wWCAqIHNpbiArIHRoaXMueSAqIGNvcztcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Ly8gYXNzdW1lcyAoY29zLCBzaW4pIHJlcHJlc2VudHMgYSByb3RhdGlvbiAoMCwgUEkpLlxyXG5cdHJvdGF0ZUJ5Q29zU2luVG93YXJkcyhjb3MsIHNpbiwgdG93YXJkcykge1xyXG5cdFx0bGV0IGNsb2Nrd2lzZSA9IHRoaXMuY3Jvc3ModG93YXJkcykgPiAwO1xyXG5cdFx0aWYgKGNsb2Nrd2lzZSlcclxuXHRcdFx0dGhpcy5yb3RhdGVCeUNvc1Npbihjb3MsIHNpbik7XHJcblx0XHRlbHNlXHJcblx0XHRcdHRoaXMucm90YXRlQnlDb3NTaW4oY29zLCAtc2luKTtcclxuXHJcblx0XHRsZXQgYWZ0ZXJDbG9ja3dpc2UgPSB0aGlzLmNyb3NzKHRvd2FyZHMpID4gMDtcclxuXHRcdGlmIChjbG9ja3dpc2UgIT09IGFmdGVyQ2xvY2t3aXNlKSB7XHJcblx0XHRcdGxldCBtYWduaXR1ZGUgPSB0aGlzLm1hZ25pdHVkZTtcclxuXHRcdFx0dGhpcy54ID0gdG93YXJkcy54O1xyXG5cdFx0XHR0aGlzLnkgPSB0b3dhcmRzLnk7XHJcblx0XHRcdHRoaXMubWFnbml0dWRlID0gbWFnbml0dWRlO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGRpc3RhbmNlRnJvbVNlZ21lbnRUb1BvaW50KHNlZ21lbnRTdGFydCwgc2VnbWVudEVuZCwgcG9pbnQpIHtcclxuXHRcdHBvaW50LnN1YnRyYWN0KHNlZ21lbnRTdGFydCk7XHJcblx0XHRzZWdtZW50RW5kLnN1YnRyYWN0KHNlZ21lbnRTdGFydCk7XHJcblx0XHRsZXQgdCA9IHBvaW50LmRvdChzZWdtZW50RW5kKSAvIHNlZ21lbnRFbmQubWFnbml0dWRlU3FyO1xyXG5cdFx0dCA9IGNsYW1wKHQsIDAsIDEpO1xyXG5cdFx0c2VnbWVudEVuZC5tdWx0aXBseSh0KTtcclxuXHRcdHJldHVybiBwb2ludC5zdWJ0cmFjdChzZWdtZW50RW5kKS5tYWduaXR1ZGU7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFZlY3RvcjtcclxuIiwiY29uc3QgTG9vcGVyID0gcmVxdWlyZSgnLi4vbG9naWMvTG9vcGVyJyk7XG5jb25zdCBHYW1lID0gcmVxdWlyZSgnLi4vbG9naWMvR2FtZScpO1xuY29uc3QgR3JhcGhpY3NEZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvR3JhcGhpY3NEZW1vJyk7XG5jb25zdCBTdGFyZmllbGREZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvU3RhcmZpZWxkRGVtbycpO1xuY29uc3QgTm9pc2VEZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvTm9pc2VEZW1vJyk7XG5jb25zdCBNYXBEZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvTWFwRGVtbycpO1xuY29uc3QgSW50ZXJmYWNlRGVtbyA9IHJlcXVpcmUoJy4uL2xvZ2ljL0ludGVyZmFjZURlbW8nKTtcblxubGV0IGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjYW52YXMnKTtcbmxldCBsb2dpY0J1dHRvbnNSb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9naWMtYnV0dG9ucy1yb3cnKTtcbmxldCBsb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcyk7XG5cbmxldCBsb2dpY0NMYXNzZXMgPSBbXG5cdEdhbWUsXG5cdEdyYXBoaWNzRGVtbyxcbl07XG5cbmxvZ2ljQ0xhc3Nlcy5mb3JFYWNoKExvZ2ljQ2xhc3MgPT4ge1xuXHRsZXQgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG5cdGJ1dHRvbi50ZXh0Q29udGVudCA9IExvZ2ljQ2xhc3MubmFtZTtcblx0YnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdGxvb3Blci5zZXRMb2dpY0NsYXNzKExvZ2ljQ2xhc3MpO1xuXHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsICcnLCBgLyR7TG9naWNDbGFzcy5uYW1lfWApO1xuXHR9KTtcblx0bG9naWNCdXR0b25zUm93LmFwcGVuZChidXR0b24pO1xufSk7XG5cbmxldCBTdGFydExvZ2ljQ2xhc3MgPSBsb2dpY0NMYXNzZXMuZmluZChMb2dpY0NsYXNzID0+IGAvJHtMb2dpY0NsYXNzLm5hbWV9YCA9PT0gbG9jYXRpb24ucGF0aG5hbWUpIHx8IGxvZ2ljQ0xhc3Nlc1swXTtcbmxvb3Blci5zZXRMb2dpY0NsYXNzKFN0YXJ0TG9naWNDbGFzcyk7XG4iXX0=
