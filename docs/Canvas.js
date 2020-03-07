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
		this.maxChannelDuration = channelDuration; // -1 indicates infinite, 0 indicates 1 tick (i.e. not channeled)
		this.channelDuration = 0; // 0 on start, 1... on subsequent calls
	}

	setUi(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		this.uiText = Keymapping.getKeys(Keymapping.Controls.ABILITY_I[uiIndex]).join('/');
	}

	update(origin, direct, map, intersectionFinder, hero, wantActive) {
		this.refresh(hero);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, hero))
			this.channelDuration++;
		else if (this.channelDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, hero);
			this.channelDuration = 0;
		}
	}

	refresh(hero) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}

		this.ready = !this.charges.isEmpty() && hero.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating);
		this.readyChannelContinue = this.maxChannelDuration && this.channelDuration && hero.sufficientStamina(this.channelStamina);
		this.repeating = false;
	}

	safeActivate(origin, direct, map, intersectionFinder, hero) {
		this.repeating = true;
		if (!this.ready && !this.readyChannelContinue)
			return false;
		if (!this.activate(origin, direct, map, intersectionFinder, hero))
			return false;

		if (this.ready) {
			this.charges.change(-1);
			hero.consumeStamina(this.stamina);
		} else {
			hero.consumeStamina(this.channelStamina);
			this.cooldown.value = this.cooldown.max;
		}
		return true;
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		/* override */
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		/* override */
	}

	get channelRatio() {
		if (this.maxChannelDuration > 0 && this.channelDuration > 0)
			return Math.min(this.channelDuration / this.maxChannelDuration, 1);
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN;
		const TOP = 1 - SIZE_WITH_MARGIN;
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

},{"../control/Keymapping":11,"../painter/Bar":88,"../painter/Rect":95,"../painter/Text":97,"../util/Constants":102,"../util/Pool":111}],3:[function(require,module,exports){
const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!booleanArray(hero.currentMove))
			return false;
		hero.safeMove(intersectionFinder, ...hero.currentMove, .1, true);
		return true;
	}
}

module.exports = Dash;

},{"../util/Number":109,"./Ability":2}],4:[function(require,module,exports){
const PassiveAbility = require('./PassiveAbility');
const Pool = require('../util/Pool');

class DelayedRegen extends PassiveAbility {
	constructor() {
		super();
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || hero.health.isFull())
			return false;
		hero.changeHealth(.0003);
		return true;
	}
}

module.exports = DelayedRegen;

},{"../util/Pool":111,"./PassiveAbility":6}],5:[function(require,module,exports){
const Ability = require('./Ability');
const Buff = require('../entities/Buff');

class IncDefense extends Ability {
	constructor() {
		super(600, 1, 0, false, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.armor = 3;
		hero.addBuff(this.buff);
		return true;
	}
}

module.exports = IncDefense;

},{"../entities/Buff":13,"./Ability":2}],6:[function(require,module,exports){
const Ability = require('./Ability');

class PassiveAbility extends Ability {
	constructor(disabledOk = false) {
		super(0, 1, 0, 0, true, 0);
		this.disabledOk = disabledOk;
	}
}

module.exports = PassiveAbility;

},{"./Ability":2}],7:[function(require,module,exports){
const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');
const Buff = require('../entities/Buff');

class ProjectileAttack extends Ability {
	constructor() {
		super(6, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = ProjectileAttack.velocity, SPREAD = .08, SIZE = .02, DAMAGE = .1;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y,
			SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			ProjectileAttack.getTime(hero), DAMAGE,
			hero.friendly);
		map.addProjectile(projectile);
		return true;
	}

	static getTime(hero) {
		return 60 * Buff.attackRange(hero.buffs);
	}

	static get velocity() {
		return .014;
	}
}

module.exports = ProjectileAttack;

},{"../entities/Buff":13,"../entities/attack/Projectile":18,"../util/Number":109,"./Ability":2}],8:[function(require,module,exports){
const PassiveAbility = require('./PassiveAbility');
const Pool = require('../util/Pool');
const {Colors} = require('../util/Constants');
const Buff = require('../entities/Buff');

class Respawn extends PassiveAbility {
	constructor(delay, x, y) {
		super(true);
		this.delay = new Pool(delay, -1);
		this.x = x;
		this.y = y;
		this.deadBuff = new Buff(delay, Colors.PLAYER_BUFFS.DEAD, 'Dead');
		this.deadBuff.disabled = 1;
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isEmpty() && this.delay.isFull()) {
			this.deadBuff.reset();
			hero.addBuff(this.deadBuff);
			this.dead = true;
		}

		if (!this.dead || !this.delay.increment())
			return false;

		this.delay.restore();
		hero.restoreHealth();
		hero.setPosition(this.x, this.y);
		this.deadBuff.expire();
		this.dead = false;
		return true;

		// todo [medium] armor buff on respawn
	}
}

module.exports = Respawn;

},{"../entities/Buff":13,"../util/Constants":102,"../util/Pool":111,"./PassiveAbility":6}],9:[function(require,module,exports){
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

},{"../util/Number":109}],10:[function(require,module,exports){
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

},{"./State":12}],11:[function(require,module,exports){
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

},{"../util/Enum":104,"./Controller":10,"./State":12}],12:[function(require,module,exports){
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

},{"../util/Enum":104}],13:[function(require,module,exports){
const Pool = require('../util/Pool');
const {Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

class Buff {
	constructor(duration, uiColor, uiText) {
		// duration param of 0 will be infinite, 1 will be active for 1 tick
		this.durationUnlimited = !duration;
		this.duration = new Pool(duration + 1, -1);
		this.uiColor = uiColor;
		this.uiText = uiText;
	}

	setUiIndex(uiIndex) {
		this.uiIndex = uiIndex;
	}

	// returns 1 if unmodified
	static get_(buffs, key) {
		return buffs.reduce((acc, {[key]: value = 0}) => acc + value, 1);
	}

	static moveSpeed(buffs) {
		return Buff.get_(buffs, 'moveSpeed_');
	}

	static attackRange(buffs) {
		return Buff.get_(buffs, 'attackRange_');
	}

	static armor(buffs) {
		return Buff.get_(buffs, 'armor_');
	}

	static disabled(buffs) {
		return Buff.get_(buffs, 'disabled_') > 1;
	}

	set moveSpeed(value) {
		this.moveSpeed_ = value;
	}

	set attackRange(value) {
		this.attackRange_ = value;
	}

	set armor(value) {
		this.armor_ = value;
	}

	set disabled(value) {
		this.disabled_ = value;
	}

	// return true if expired. Leaving duration undefined or 0 will never expire.
	tick() {
		return this.expired || !this.durationUnlimited && this.duration.increment();
	}

	reset() {
		this.expired = false;
		this.duration.restore();
	}

	expire() {
		this.duration.value = 0;
		this.expired = true;
	}

	paintUi(painter, camera) {
		let left = 1 - (this.uiIndex + 1) * (Positions.BUFF_SIZE + Positions.MARGIN);
		let top = 1 - Positions.MARGIN * 3 - Positions.BAR_HEIGHT * 2 - Positions.BUFF_SIZE;
		let size = Positions.BUFF_SIZE;

		// background
		painter.add(new Rect(left, top, size, size, {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		let fillHeight = size * this.duration.getRatio();
		painter.add(new Rect(left, top + size - fillHeight, size, fillHeight, {fill: true, color: this.uiColor.get()}));

		// text
		painter.add(new Text(left + size / 2, top + size / 2, this.uiText));
	}

	paintAt(painter, camera, left, top, size) {
		// background
		painter.add(Rect.withCamera(camera, left, top, size, size, {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		let fillHeight = size * this.duration.getRatio();
		painter.add(Rect.withCamera(camera, left, top + size - fillHeight, size, fillHeight, {fill: true, color: this.uiColor.get()}));
	}
}

module.exports = Buff;

},{"../painter/Rect":95,"../painter/Text":97,"../util/Constants":102,"../util/Pool":111}],14:[function(require,module,exports){
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

},{"../intersection/Bounds":71,"../util/Number":109}],15:[function(require,module,exports){
const Entity = require('./Entity');
const Pool = require('../util/Pool');
const Buff = require('./Buff');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
		this.buffs = [];
	}

	refresh() {
		this.tickBuffs();
	}

	changeHealth(amount) {
		this.health.change(amount / Buff.armor(this.buffs));
	}

	restoreHealth() {
		this.health.restore();
	}

	addBuff(buff) {
		if (this.buffs.indexOf(buff) === -1) {
			this.buffs.push(buff);
			return true;
		}
	}

	tickBuffs() {
		this.buffs = this.buffs.filter(buff => !buff.tick());
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

module.exports = LivingEntity;

},{"../util/Pool":111,"./Buff":13,"./Entity":14}],16:[function(require,module,exports){
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

},{"../../intersection/IntersectionFinder":72,"../../painter/RectC":96,"../../util/Constants":102,"../../util/Number":109,"../Entity":14}],17:[function(require,module,exports){
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

},{"../../intersection/IntersectionFinder":72,"../../painter/Line":90,"../../util/Constants":102,"../Entity":14}],18:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {randVector} = require('../../util/Number');
const DamageDust = require('../particles/DamageDust');
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

},{"../../intersection/IntersectionFinder":72,"../../painter/RectC":96,"../../util/Constants":102,"../../util/Number":109,"../Entity":14,"../particles/DamageDust":50}],19:[function(require,module,exports){
const Vector = require('../../util/Vector');
const {minWhichA, clamp, rand, randInt} = require('../../util/Number');

const ProjectileAttack = require('../../abilities/ProjectileAttack');

class EggBot {
	constructor(player, coopBotHeroes, hostileBotHeroes, egg, centerDir) {
		this.player = player;
		this.coopBotHeroes = coopBotHeroes;
		this.hostileBotHeroes = hostileBotHeroes;
		this.egg = egg;
		this.centerDir = centerDir;
	}

	get botHeroes() {
		return [...this.coopBotHeroes, ...this.hostileBotHeroes];
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.egg.update(map);
		let target = this.egg.ownerHero || this.egg;
		let friendlies = [this.player, ...this.coopBotHeroes].filter(botHero => !botHero.health.isEmpty());
		let hostiles = this.hostileBotHeroes.filter(botHero => !botHero.health.isEmpty());

		this.coopBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, friendlies, hostiles, target, this.centerDir);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});

		this.hostileBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, hostiles, friendlies, target, this.centerDir);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});
	}

	static heroGoals(hero, allies, hostiles, target, centerDir) {
		let movement = EggBot.heroMovement(hero, allies, hostiles, target, centerDir);
		let movementMagSqr = movement.magnitudeSqr;
		if (movementMagSqr)
			movement.magnitude = 1;

		let abilitiesDirect = hostiles.length ? EggBot.closestHostileDir(hero, hostiles) : new Vector(0, 0);
		abilitiesDirect.add(Vector.fromRand(abilitiesDirect.magnitude / 5));

		// todo [high] tune
		let projectileAttackDistance = ProjectileAttack.getTime(hero) * ProjectileAttack.velocity + .1;
		// 0.94 0 Infinity
		let activeProjectileAttack = rand() < (projectileAttackDistance / abilitiesDirect.magnitude - .9) * 5;
		let activeAbilitiesWanted = [
			hostiles.length && activeProjectileAttack,
			movementMagSqr > .1 && movementMagSqr < 3 && rand() < .04, // dash
			hero.recentDamage.get() > .8, // increase defense
		];

		return {movement, activeAbilitiesWanted, abilitiesDirect};
	}

	static heroMovement(hero, allies, hostiles, target, centerDir) {
		// todo [high] tune
		let movement = new Vector(0, 0);
		let pos = Vector.fromObj(hero);

		let selfTarget = hero === target;
		let alliedTarget = false;
		let hostileTarget = false;

		let alliesMovement = allies.reduce((movement, ally) => {
			if (ally === hero)
				return movement;
			alliedTarget = alliedTarget || ally === target;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(ally), .2, 4, 1, .5, 1, 0);
			return movement.add(delta);
		}, new Vector(0, 0));
		alliesMovement.multiply(1 / (allies.length + 1));

		let idealHostileDist = selfTarget ? .9 : .4;
		let hostilesMovement = hostiles.reduce((movement, hostile) => {
			hostileTarget = hostileTarget || hostile === target;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(hostile), idealHostileDist, 1, 1);
			return movement.add(delta);
		}, new Vector(0, 0));
		hostilesMovement.multiply(1 / (hostiles.length + 1));

		let targetDist = !alliedTarget && !hostileTarget ? 0 : .3;
		let targetMovement = EggBot.movementFlock(hero, Vector.fromObj(target), targetDist, 1, 4, .01, 2, 1);

		if (rand() > .996 || !hero.avoidLineMovementDirection)
			hero.avoidLineMovementDirection = randInt(2) * 2 - 1;
		let avoidLineMovement = hostiles.reduce((movement, hostile) => {
			let delta = Vector.fromObj(hostile).subtract(pos);
			delta.rotateByCosSin(0, hero.avoidLineMovementDirection * movement.cross(delta) > 0 ? -1 : 1);
			delta.magnitude = clamp(1.25 * .4 - delta.magnitude * .4, 0, 1);
			return movement.add(delta);
		}, new Vector(0, 0));

		// todo [high] conditional on having target
		let centerMovement = centerDir.copy.subtract(pos);
		centerMovement.magnitude = .1;

		movement
			.add(alliesMovement)
			.add(hostilesMovement)
			.add(targetMovement)
			.add(avoidLineMovement)
			.add(centerMovement);
		return movement;
	}

	static movementFlock(origin, target,
	                     idealDist, maxRepulse = 1, maxAttract = maxRepulse,
	                     fadeStartDist = idealDist * 2, fadeEndDist = fadeStartDist * 2, fadeAttract = Math.min(maxAttract, .05)) {
		// origin won't be modified. target will be modified.
		let delta = target.subtract(origin);
		let magnitude = delta.magnitude;
		if (!magnitude)
			return delta;
		let distanceToForce = [[0, -maxRepulse], [idealDist, 0], [fadeStartDist, maxAttract], [fadeEndDist, fadeAttract], [Infinity, fadeAttract]];
		let maxForceIndex = distanceToForce.findIndex(([distance]) => magnitude < distance);
		let blend = (magnitude - distanceToForce[maxForceIndex - 1][0]) / (distanceToForce[maxForceIndex][0] - distanceToForce[maxForceIndex - 1][0]);
		delta.magnitude = blend * distanceToForce[maxForceIndex][1] + (1 - blend) * distanceToForce[maxForceIndex - 1][1];
		return delta;
	}

	static closestHostileDir(hero, hostiles) {
		let pos = Vector.fromObj(hero);
		let deltas = hostiles.map(hostile => Vector.fromObj(hostile).subtract(pos));
		let i = minWhichA(deltas.map(delta => delta.magnitude));

		let projectedMovement = new Vector(...hostiles[i].currentMove);
		if (projectedMovement.magnitude) {
			projectedMovement.magnitude = .3 * deltas[i].magnitude; // .014 (projectile v) / .005 (hero v) = .3
			deltas[i].add(projectedMovement);
		}
		return deltas[i];
	}
}

module.exports = EggBot;

},{"../../abilities/ProjectileAttack":7,"../../util/Number":109,"../../util/Vector":113}],20:[function(require,module,exports){
const Hero = require('./Hero');
const Buff = require('../Buff');

class BotHero extends Hero {
	update(map, intersectionFinder, monsterKnowledge, goals) {
		this.refresh();
		this.updateMove(intersectionFinder, goals.movement.x, goals.movement.y, .005 * Buff.moveSpeed(this.buffs));
		// todo [medium] speed should be parameterizable in Hero constructor.
		this.updateAbilities(map, intersectionFinder, goals.activeAbilitiesWanted, goals.abilitiesDirect);
		this.createMovementParticle(map);
	}
}

module.exports = BotHero;

},{"../Buff":13,"./Hero":21}],21:[function(require,module,exports){
const LivingEntity = require('../LivingEntity');
const Decay = require('../../util/Decay');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const Pool = require('../../util/Pool');
const Buff = require('../Buff');
const {setMagnitude, booleanArray, rand, randVector} = require('../../util/Number');
const Dust = require('../particles/Dust');
const {Colors} = require('../../util/Constants');
const BarC = require('../../painter/BarC');

class Hero extends LivingEntity {
	constructor(x, y, width, height, health, stamina, staminaRefresh, friendly, abilities, passiveAbilities, nameplateLifeColor, nameplateStaminaColor) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_UNIT : IntersectionFinder.Layers.HOSTILE_UNIT;
		super(x, y, width, height, health, layer);
		this.stamina = new Pool(stamina, staminaRefresh); // todo [medium] consider replacing staminaRefresh with passive ability
		this.friendly = friendly;
		this.abilities = abilities;
		this.passiveAbilities = passiveAbilities;
		this.nameplateLifeColor = nameplateLifeColor;
		this.nameplateStaminaColor = nameplateStaminaColor;
		this.recentDamage = new Decay(.1, .001);
		this.currentMove = [0, 0];
	}

	refresh() {
		super.refresh();
		this.recentDamage.decay();
		this.stamina.increment();
	}

	updateMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		if (Buff.disabled(this.buffs))
			return;
		this.currentMove = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, magnitude, noSlide);
	}

	updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct) {
		let disabled = Buff.disabled(this.buffs);
		if (!disabled)
			this.abilities.forEach((ability, i) =>
				ability.update(this, direct, map, intersectionFinder, this, activeAbilitiesWanted[i]));
		this.passiveAbilities.forEach(ability => {
			if (!disabled || ability.disabledOk)
				ability.update(this, direct, map, intersectionFinder, this, true)
		});
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

	restoreHealth() {
		super.restoreHealth();
		this.stamina.restore();
	}

	paint(painter, camera) {
		const BAR_WIDTH = .15, LIFE_HEIGHT = .02, STAMINA_HEIGHT = .01, MARGIN = .005;
		super.paint(painter, camera);
		// life bar
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height - (LIFE_HEIGHT + STAMINA_HEIGHT) / 2 - MARGIN, BAR_WIDTH, LIFE_HEIGHT, this.health.getRatio(),
			this.nameplateLifeColor.getShade(Colors.BAR_SHADING), this.nameplateLifeColor.get(), this.nameplateLifeColor.get(Colors.BAR_SHADING)));
		// stamina bar
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, BAR_WIDTH, STAMINA_HEIGHT, this.stamina.getRatio(),
			this.nameplateStaminaColor.getShade(Colors.BAR_SHADING), this.nameplateStaminaColor.get(), this.nameplateStaminaColor.get(Colors.BAR_SHADING)));
		// buffs
		let buffSize = LIFE_HEIGHT + STAMINA_HEIGHT + MARGIN;
		this.buffs.forEach((buff, i) =>
			buff.paintAt(painter, camera,
				this.x + BAR_WIDTH / 2 + MARGIN + (buffSize + MARGIN) * i,
				this.y - this.height - buffSize + STAMINA_HEIGHT / 2,
				buffSize));
	}
}

module.exports = Hero;

},{"../../intersection/IntersectionFinder":72,"../../painter/BarC":89,"../../util/Constants":102,"../../util/Decay":103,"../../util/Number":109,"../../util/Pool":111,"../Buff":13,"../LivingEntity":15,"../particles/Dust":51}],22:[function(require,module,exports){
const Hero = require('./Hero');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors, Positions} = require('../../util/Constants');
const VShip = require('../../graphics/VShip');
const ProjectileAttack = require('../../abilities/ProjectileAttack');
const Dash = require('../../abilities/Dash');
const IncDefense = require('../../abilities/IncDefense');
const DelayedRegen = require('../../abilities/DelayedRegen');
const Buff = require('.././Buff');
const Keymapping = require('../../control/Keymapping');
const Bounds = require('../../intersection/Bounds');
const RectC = require('../../painter/RectC');
const Bar = require('../../painter/Bar');
const Rect = require('../../painter/Rect');

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends Hero {
	// todo [medium] deprecated
	static defaultConstructor() {
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		abilities.forEach((ability, i) => ability.setUi(i));
		let passiveAbilities = [
			new DelayedRegen(),
		];

		let player = new Player(0, 0, .05, .05, 1, 80, .13, true, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		player.setGraphics(new VShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER.get()}));
		return player;
	}

	update(map, controller, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, intersectionFinder);
		this.abilityControl(map, controller, intersectionFinder);
		this.targetLockControl(controller, intersectionFinder);
		this.createMovementParticle(map);
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

		this.updateMove(intersectionFinder, dx, dy, .005 * Buff.moveSpeed(this.buffs));
	}

	abilityControl(map, controller, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};
		let activeAbilitiesWanted = this.abilities.map((_, i) =>
			Keymapping.getControlState(controller, Keymapping.Controls.ABILITY_I[i]).active);
		this.updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct);
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

	refresh() {
		super.refresh();
		this.buffs.forEach((buff, i) => buff.setUiIndex(i));
	}

	removeUi() {
		return false;
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

		// buffs
		this.buffs.forEach(buff => buff.paintUi(painter, camera));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;

},{"../../abilities/Dash":3,"../../abilities/DelayedRegen":4,"../../abilities/IncDefense":5,"../../abilities/ProjectileAttack":7,"../../control/Keymapping":11,"../../graphics/VShip":67,"../../intersection/Bounds":71,"../../intersection/IntersectionFinder":72,"../../painter/Bar":88,"../../painter/Rect":95,"../../painter/RectC":96,"../../util/Constants":102,".././Buff":13,"./Hero":21}],23:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"../../util/Vector":113,"./Module":29}],24:[function(require,module,exports){
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

},{"../../util/Enum":104,"../attack/AreaDegen":16,"./Module":29}],25:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"../../util/Vector":113,"./Module":29}],26:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Phase":110,"./ModuleManager":30}],27:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"./ModuleManager":30}],28:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"./ModuleManager":30}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
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

	// todo [medium] rename to setPhase
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

},{"./Module":29}],31:[function(require,module,exports){
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

},{"../../util/Enum":104,"../attack/AreaDegen":16,"./Module":29}],32:[function(require,module,exports){
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

},{"../../util/Enum":104,"./ModuleManager":30}],33:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Phase":110,"./ModuleManager":30}],34:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"../../util/Vector":113,"./Module":29}],35:[function(require,module,exports){
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

},{"../../util/Enum":104,"../../util/Number":109,"../../util/Vector":113,"./Module":29}],36:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {rand, randVector} = require('../../util/Number');
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
		if (!this.predictableRate && rand() > this.rate)
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

},{"../../util/Enum":104,"../../util/Number":109,"../attack/Projectile":18,"./Module":29}],37:[function(require,module,exports){
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

},{"../../painter/Line":90,"../../util/Constants":102,"../../util/Enum":104,"../../util/Vector":113,"../attack/Laser":17,"./Module":29}],38:[function(require,module,exports){
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

},{"../../util/Enum":104,"./ModuleManager":30}],39:[function(require,module,exports){
const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Period = require('../modules/Period');
const Aim = require('../modules/Aim');
const Chase = require('../modules/Chase');
const Shotgun = require('../modules/Shotgun');
const Dash = require('../modules/Dash');
const Trigger = require('../modules/Trigger');
const NearbyDegen = require('../modules/NearbyDegen');
// const Boomerang = require('../modules/Boomerang');

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
}

module.exports = Champion;

},{"../../graphics/WShip":68,"../../util/Constants":102,"../../util/Enum":104,"../../util/Phase":110,"../modules/Aim":23,"../modules/Chase":25,"../modules/Dash":27,"../modules/NearbyDegen":31,"../modules/Period":33,"../modules/Shotgun":36,"../modules/Trigger":38,"./Monster":40}],40:[function(require,module,exports){
const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const ModuleManager = require('../modules/ModuleManager');
const {Colors, Positions} = require('../../util/Constants');
const BarC = require('../../painter/BarC');
const Bar = require('../../painter/Bar');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.moduleManager = new ModuleManager();
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.refresh();
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
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

},{"../../intersection/IntersectionFinder":72,"../../painter/Bar":88,"../../painter/BarC":89,"../../util/Constants":102,"../LivingEntity":15,"../modules/ModuleManager":30}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Period = require('../../modules/Period');
const Rotate = require('../../modules/Rotate');
const Aim = require('../../modules/Aim');
const StaticLaser = require('../../modules/StaticLaser');

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
}

module.exports = AimingLaserTurret;

},{"../../../graphics/Rect1DotsShip":61,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Phase":110,"../../modules/Aim":23,"../../modules/Period":33,"../../modules/Rotate":35,"../../modules/StaticLaser":37,".././Monster":40}],43:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DoubleHorizDiamondShip = require('../../../graphics/DoubleHorizDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../modules/Distance');
const Aim = require('../../modules/Aim');
const Chase = require('../../modules/Chase');
const Cooldown = require('../../modules/Cooldown');
const AreaDegenLayer = require('../../modules/AreaDegenLayer');

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
}

module.exports = BombLayer;

},{"../../../graphics/DoubleHorizDiamondShip":57,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Number":109,"../../../util/Phase":110,"../../modules/Aim":23,"../../modules/AreaDegenLayer":24,"../../modules/Chase":25,"../../modules/Cooldown":26,"../../modules/Distance":28,".././Monster":40}],44:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const HexagonShip = require('../../../graphics/HexagonShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../modules/Distance');
const Period = require('../../modules/Period');
const Aim = require('../../modules/Aim');
const Chase = require('../../modules/Chase');
const Dash = require('../../modules/Dash');
const Trigger = require('../../modules/Trigger');
const NearbyDegen = require('../../modules/NearbyDegen');

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
}

module.exports = DashChaser;

},{"../../../graphics/HexagonShip":59,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Number":109,"../../../util/Phase":110,"../../modules/Aim":23,"../../modules/Chase":25,"../../modules/Dash":27,"../../modules/Distance":28,"../../modules/NearbyDegen":31,"../../modules/Period":33,"../../modules/Trigger":38,".././Monster":40}],45:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DiamondShip = require('../../../graphics/DiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../modules/Distance');
const Aim = require('../../modules/Aim');
const PatternedPeriod = require('../../modules/PatternedPeriod');
const Chase = require('../../modules/Chase');
const NearbyDegen = require('../../modules/NearbyDegen');

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
}

module.exports = ExplodingTick;

},{"../../../graphics/DiamondShip":56,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Number":109,"../../../util/Phase":110,"../../modules/Aim":23,"../../modules/Chase":25,"../../modules/Distance":28,"../../modules/NearbyDegen":31,"../../modules/PatternedPeriod":32,".././Monster":40}],46:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const MechanicalBossEarly = require('./MechanicalBossEarly');
const Phase = require('../../../util/Phase');
const Period = require('../../modules/Period');
const Position = require('../../modules/Position');
const AreaDegenLayer = require('../../modules/AreaDegenLayer');

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

},{"../../../util/Enum":104,"../../../util/Phase":110,"../../modules/AreaDegenLayer":24,"../../modules/Period":33,"../../modules/Position":34,"./MechanicalBossEarly":47}],47:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Vector = require('../../../util/Vector');
const Distance = require('../../modules/Distance');
const Period = require('../../modules/Period');
const NearbyDegen = require('../../modules/NearbyDegen');
const Aim = require('../../modules/Aim');
const Shotgun = require('../../modules/Shotgun');
const StaticLaser = require('../../modules/StaticLaser');

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
}

module.exports = MechanicalBossEarly;

// todo [medium] rotation

},{"../../../graphics/Rect1DotsShip":61,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Phase":110,"../../../util/Vector":113,"../../modules/Aim":23,"../../modules/Distance":28,"../../modules/NearbyDegen":31,"../../modules/Period":33,"../../modules/Shotgun":36,"../../modules/StaticLaser":37,".././Monster":40}],48:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const SplitDiamondShip = require('../../../graphics/SplitDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../modules/Distance');
const Aim = require('../../modules/Aim');
const Chase = require('../../modules/Chase');
const Cooldown = require('../../modules/Cooldown');
const Shotgun = require('../../modules/Shotgun');

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
}

module.exports = SniperTick;

},{"../../../graphics/SplitDiamondShip":65,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Number":109,"../../../util/Phase":110,"../../modules/Aim":23,"../../modules/Chase":25,"../../modules/Cooldown":26,"../../modules/Distance":28,"../../modules/Shotgun":36,".././Monster":40}],49:[function(require,module,exports){
const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect4DotsShip = require('../../../graphics/Rect4DotsShip');
const Phase = require('../../../util/Phase');
const Vector = require('../../../util/Vector');
const Period = require('../../modules/Period');
const Aim = require('../../modules/Aim');
const Shotgun = require('../../modules/Shotgun');

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
}

module.exports = Static4DirTurret;

},{"../../../graphics/Rect4DotsShip":62,"../../../util/Constants":102,"../../../util/Enum":104,"../../../util/Phase":110,"../../../util/Vector":113,"../../modules/Aim":23,"../../modules/Period":33,"../../modules/Shotgun":36,".././Monster":40}],50:[function(require,module,exports){
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

},{"../../intersection/IntersectionFinder":72,"../../painter/RectC":96,"../../util/Constants":102,"../Entity":14}],51:[function(require,module,exports){
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

},{"../../intersection/IntersectionFinder":72,"../../painter/RectC":96,"../../util/Constants":102,"../Entity":14}],52:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RockGraphic = require('../../graphics/RockGraphic');
const Buff = require('../Buff');
const Vector = require('../../util/Vector');
const {minWhichA, randInt} = require('../../util/Number');
const RectC = require('../../painter/RectC');

class Egg extends Entity {
	constructor(possiblePositions) {
		const size = .1;
		super(0, 0, size, size, IntersectionFinder.Layers.UNIT_TRACKER);
		this.possiblePositions = possiblePositions;
		this.randomPosition();
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.EGG.get()}));
		this.slowDebuff = new Buff(0, Colors.Entity.EGG, 'EGG');
		this.slowDebuff.moveSpeed = -.3;
		this.slowDebuff.attackRange = -.3;
	}

	randomPosition() {
		let {x, y} = this.possiblePositions[randInt(this.possiblePositions.length)];
		this.setPosition(x, y);
	}

	update(map) {
		if (this.ownerHero && !this.ownerHero.health.isEmpty())
			this.ownerHero.changeHealth(-.001);

		if (this.ownerHero && this.ownerHero.health.isEmpty()) {
			this.ownerHero = null;
			this.randomPosition();
			this.slowDebuff.expire();
		}

		if (!this.ownerHero) {
			if (this.queuedTrackedIntersections[0]) {
				this.ownerHero = this.queuedTrackedIntersections[0];
				this.queuedTrackedIntersections = [];
				this.slowDebuff.reset();
				this.ownerHero.addBuff(this.slowDebuff);
			}
		}
	}

	paint(painter, camera) {
		if (!this.ownerHero)
			super.paint(painter, camera);
		else
			painter.add(RectC.withCamera(camera, this.ownerHero.x, this.ownerHero.y, this.width, this.height, {fill: false, color: Colors.Entity.EGG.get()}));
	}
}

module.exports = Egg;

},{"../../graphics/RockGraphic":64,"../../intersection/IntersectionFinder":72,"../../painter/RectC":96,"../../util/Constants":102,"../../util/Number":109,"../../util/Vector":113,"../Buff":13,"../Entity":14}],53:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RectGraphic = require('../../graphics/RectGraphic');

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

},{"../../graphics/RectGraphic":63,"../../intersection/IntersectionFinder":72,"../../util/Constants":102,"../Entity":14}],54:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RockGraphic = require('../../graphics/RockGraphic');

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.ROCK.get()}));
	}
}

module.exports = Rock;

},{"../../graphics/RockGraphic":64,"../../intersection/IntersectionFinder":72,"../../util/Constants":102,"../Entity":14}],55:[function(require,module,exports){
const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RockGraphic = require('../../graphics/RockGraphic');

class RockMineral extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.ROCK_MINERAL.get()}));
	}
}

module.exports = RockMineral;

},{"../../graphics/RockGraphic":64,"../../intersection/IntersectionFinder":72,"../../util/Constants":102,"../Entity":14}],56:[function(require,module,exports){
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

},{"./Graphics":58}],57:[function(require,module,exports){
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

},{"./Graphics":58}],58:[function(require,module,exports){
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

},{"./PathCreator":60}],59:[function(require,module,exports){
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

},{"./Graphics":58,"./PathCreator":60}],60:[function(require,module,exports){
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

},{"../painter/Path":94,"../util/Number":109}],61:[function(require,module,exports){
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

},{"../util/Color":101,"./Graphics":58,"./PathCreator":60}],62:[function(require,module,exports){
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

},{"../util/Color":101,"./Graphics":58,"./PathCreator":60}],63:[function(require,module,exports){
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

},{"./Graphics":58}],64:[function(require,module,exports){
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

},{"../util/Number":109,"./Graphics":58}],65:[function(require,module,exports){
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

},{"./Graphics":58}],66:[function(require,module,exports){
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

},{"../util/Color":101,"./Graphics":58,"./PathCreator":60}],67:[function(require,module,exports){
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

},{"./Graphics":58}],68:[function(require,module,exports){
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

},{"./Graphics":58}],69:[function(require,module,exports){
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

},{"../painter/Rect":95,"../painter/Text":97,"../util/Constants":102,"../util/Enum":104,"./Interface":70}],70:[function(require,module,exports){
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

},{"../intersection/Bounds":71}],71:[function(require,module,exports){
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

},{"../util/Enum":104}],72:[function(require,module,exports){
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
	'UNIT_TRACKER',         // intersects with friendly and hostile units
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
		// todo [medium] allow units to move through projectiles, while taking damage
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

		// units trackers intersect with friendly and hostile units un-symmetrically
		this.addCollision(Layers.UNIT_TRACKER, Layers.FRIENDLY_UNIT, false);
		this.addCollision(Layers.UNIT_TRACKER, Layers.HOSTILE_UNIT, false);
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
				trackedOnlyReferences = trackedOnlyReferences.filter(([_, moveTracked]) => moveTracked <= move).map(([reference]) => reference);
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
		trackedOnlyReferences = trackedOnlyReferences.filter(([_, moveTracked]) => moveTracked <= move).map(([reference]) => reference);

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

},{"../util/Enum":104,"../util/LinkedList":107,"../util/Number":109,"./Bounds":71}],73:[function(require,module,exports){
const Logic = require('./Logic');
const Keymapping = require('../control/Keymapping');
const Map = require('../map/Map');
const MonsterKnowledge = require('../entities/monsters/MonsterKnowledge');
const MapGenerator = require('../map/MapGeneratorTimed');
const Minimap = require('../map/Minimap');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

const UI = true;

class Game extends Logic {
	constructor(controller, painterSet, MapGeneratorClass = MapGenerator) {
		super(controller, painterSet);
		this.map = new Map();
		this.mapGenerator = new MapGeneratorClass(this.map);
		this.player = this.mapGenerator.player;
		this.monsterKnowledge = new MonsterKnowledge();
		this.monsterKnowledge.setPlayer(this.player);
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

},{"../camera/Camera":9,"../control/Keymapping":11,"../entities/monsters/MonsterKnowledge":41,"../map/Map":82,"../map/MapGeneratorTimed":86,"../map/Minimap":87,"../starfield/Starfield":99,"./Logic":77}],74:[function(require,module,exports){
const Game = require('./Game');
const MapGeneratorEgg = require('../map/MapGeneratorEgg');

// todo [medium] rework canvas to avoid having to subclass a logic class just to set a constructor parameter
class GameEgg extends Game {
	constructor(controller, painterSet) {
		super(controller, painterSet, MapGeneratorEgg);
	}
}

module.exports = GameEgg;

},{"../map/MapGeneratorEgg":84,"./Game":73}],75:[function(require,module,exports){
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

},{"../graphics/TestShip":66,"../util/Number":109,"./Logic":77}],76:[function(require,module,exports){
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

},{"../interface/Button":69,"./Logic":77}],77:[function(require,module,exports){
class Logic {
	constructor(controller, painterSet) {
		this.controller = controller;
		this.painterSet = painterSet;
	}

	iterate() {
	}
}

module.exports = Logic;

},{}],78:[function(require,module,exports){
const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
const FpsTracker = require('../util/FpsTracker');
const {Positions} = require('../util/Constants');
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
			this.painterSet.uiPainter.add(new Text(1 - Positions.MARGIN, Positions.MARGIN, `fps: ${this.fpsTracker.getFps()}`, {align: 'right'}));
			this.painterSet.paint();
			this.controller.expire();
		}
	}
}

module.exports = Looper;

},{"../control/Controller":10,"../painter/PainterCompositor":92,"../painter/Text":97,"../util/Constants":102,"../util/FpsTracker":105}],79:[function(require,module,exports){
const LinkedList = require('../util/LinkedList');
const Entity = require('../entities/Entity');
const Logic = require('./Logic');
const MapGenerator = require('../map/MapGeneratorStaged');
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
		new MapGenerator(this.map);
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

},{"../camera/Camera":9,"../entities/Entity":14,"../map/MapGeneratorStaged":85,"../painter/RectC":96,"../util/Color":101,"../util/LinkedList":107,"./Logic":77}],80:[function(require,module,exports){
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

},{"../painter/Rect":95,"../painter/RectC":96,"../painter/Text":97,"../util/Color":101,"../util/Noise":108,"../util/Number":109,"./Logic":77}],81:[function(require,module,exports){
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

},{"../camera/Camera":9,"../painter/Text":97,"../starfield/Starfield":99,"../starfield/StarfieldNoise":100,"../util/Color":101,"./Logic":77}],82:[function(require,module,exports){
const IntersectionFinder = require('../intersection/IntersectionFinder');
const LinkedList = require('../util/LinkedList');
const Bounds = require('../intersection/Bounds');
const Rect = require('../painter/Rect');

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
		this.stills = new LinkedList();
		this.bots = new LinkedList();
		this.botHeroes = new LinkedList();
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

	get heroes() {
		return [this.player, ...this.botHeroes];
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

	addBot(bot) {
		this.bots.add(bot);
		bot.botHeroes.forEach(botHero => this.addBotHero(botHero));
	}

	addBotHero(botHero) {
		this.botHeroes.add(botHero);
		botHero.addIntersectionBounds(this.intersectionFinder);
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

	addProjectile(projectile) { // todo [medium] rename to addAttack or such
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	addParticle(particle) {
		this.particles.add(particle);
	}

	update(controller, monsterKnowledge) {
		this.player.update(this, controller, this.intersectionFinder, monsterKnowledge);
		this.bots.forEach(bot => bot.update(this, this.intersectionFinder, monsterKnowledge));
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
		this.botHeroes.forEach(botHero => botHero.paint(painter, camera));
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

},{"../intersection/Bounds":71,"../intersection/IntersectionFinder":72,"../painter/Rect":95,"../util/LinkedList":107}],83:[function(require,module,exports){
const {Positions} = require('../util/Constants');
const {round} = require('../util/Number');
const Text = require('../painter/Text');

class MapGenerator {
	constructor(map) {
		this.map = map;
		this.timer = 0;
		// must create player
	}

	update() {
		this.timer++;
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGenerator;

},{"../painter/Text":97,"../util/Constants":102,"../util/Number":109}],84:[function(require,module,exports){
const MapGenerator = require('./MapGenerator');
const Vector = require('../util/Vector');
const {NoiseSimplex} = require('../util/Noise');
const {rand, randInt, floor, round} = require('../util/Number');
const MapBoundary = require('../entities/stills/MapBoundary');
const Rock = require('../entities/stills/Rock');
const RockMineral = require('../entities/stills/RockMineral');
const Egg = require('../entities/stills/Egg');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const Dash = require('../abilities/Dash');
const IncDefense = require('../abilities/IncDefense');
const DelayedRegen = require('../abilities/DelayedRegen');
const Respawn = require('../abilities/Respawn');
const {Colors} = require('../util/Constants');
const Player = require('../entities/heroes/Player');
const BotHero = require('../entities/heroes/BotHero');
const VShip = require('../graphics/VShip');
const WShip = require('../graphics/WShip');
const EggBot = require('../entities/bot/EggBot');
const {Positions} = require('../util/Constants');
const Text = require('../painter/Text');

const WIDTH = 2.5, HEIGHT = 2.5;
const SPAWN_X1 = WIDTH / 5;
const SPAWN_X2 = WIDTH - SPAWN_X1;
const CENTER_V = new Vector(WIDTH / 2, HEIGHT / 2);
const CENTER_V_MAG = CENTER_V.magnitude; // todo [low] cache vector calculations and remove this pre-computation

class MapGeneratorEgg extends MapGenerator {
	constructor(map) {
		super(map);

		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.generateEgg();
		this.generateBot();

		map.addPlayer(this.player);
		map.addUi(this);

		this.scores = [0, 0];
		this.win = -1;
	}

	generateBoundaries() {
		MapBoundary.createBoxBoundaries(WIDTH, HEIGHT).forEach(mapBoundary => this.map.addStill(mapBoundary));
	}

	generateRocks() {
		const ROCKS = 4, ROCK_MINERALS = 0;
		const ROCK_MAX_SIZE = .3;
		this.rockNoise.positions(ROCKS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new Rock(...position, rand(ROCK_MAX_SIZE))));
		this.rockNoise.positions(ROCK_MINERALS, WIDTH, HEIGHT).forEach(position => this.map.addStill(new RockMineral(...position, rand(ROCK_MAX_SIZE))));
	}

	generateEgg() {
		let n = 4;
		this.egg = new Egg([{x: WIDTH / 2, y: HEIGHT / n}, {x: WIDTH / 2, y: HEIGHT * (1 - 1 / n)}]);
		this.map.addStill(this.egg);
	}

	generateBot() {
		let coopBots = 1;
		let hostileBots = 2;
		let playerIndex = randInt(coopBots + 1);
		this.player = MapGeneratorEgg.generatePlayer(SPAWN_X1, (playerIndex + 1) / (coopBots + 2) * HEIGHT);
		let coopBotHeroes = [...Array(coopBots)].map((_, i, a) => MapGeneratorEgg.generateBotHero(SPAWN_X1, (i + 1 + (i >= playerIndex)) / (a.length + 2) * HEIGHT, true));
		let hostileBotHeroes = [...Array(hostileBots)].map((_, i, a) => MapGeneratorEgg.generateBotHero(SPAWN_X2, (i + 1) / (a.length + 1) * HEIGHT, false));
		let bot = new EggBot(this.player, coopBotHeroes, hostileBotHeroes, this.egg, CENTER_V);
		this.map.addBot(bot);
	}

	static generateHeroAbilities(x, y) {
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		abilities.forEach((ability, i) => ability.setUi(i)); // some abilities give buffs which require UI colors to be set
		let passiveAbilities = [
			new DelayedRegen(),
			new Respawn(240, x, y),
		];
		return {abilities, passiveAbilities};
	}

	static generatePlayer(x, y) {
		let {abilities, passiveAbilities} = MapGeneratorEgg.generateHeroAbilities(x, y);
		abilities.forEach((ability, i) => ability.setUi(i));
		let payer = new Player(x, y, .05, .05, 1, 80, .13, true, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		payer.setGraphics(new VShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER_GREEN.get()}));
		return payer;
	}

	static generateBotHero(x, y, friendly) {
		let {abilities, passiveAbilities} = MapGeneratorEgg.generateHeroAbilities(x, y);
		let botHero = new BotHero(x, y, .05, .05, 1, 80, .13, friendly, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		botHero.setGraphics(new VShip(.05, .05, {fill: true, color: friendly ? Colors.Entity.FRIENDLY.get() : Colors.Entity.MONSTER.get()}));
		return botHero;
	}

	update() {
		if (this.win !== -1)
			return;
		this.timer++;
		if (!this.egg.ownerHero)
			return;
		let scoreI = this.egg.ownerHero.friendly ? 0 : 1;
		let scoreInc = 1 - Vector.fromObj(this.egg.ownerHero).subtract(CENTER_V).magnitude / CENTER_V_MAG;
		this.scores[scoreI] += scoreInc;
		if (this.scores[scoreI] >= 1000)
			this.win = scoreI;
	}

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN, Positions.MARGIN * 2 + Positions.BAR_HEIGHT,
			`time: ${round(this.timer / 100)}`, font));
		painter.add(new Text(
			1 - Positions.MARGIN, Positions.MARGIN * 3 + Positions.BAR_HEIGHT * 2,
			`score: ${this.scores.map(s => floor(s / 100)).join(' v ')}`, font));

		if (this.win !== -1)
			painter.add(new Text(
				.5, .4,
				`${this.win ? 'Red' : 'Green'} Team Wins!`, {size: '25px', align: 'center'}));
	}
}

module.exports = MapGeneratorEgg;

},{"../abilities/Dash":3,"../abilities/DelayedRegen":4,"../abilities/IncDefense":5,"../abilities/ProjectileAttack":7,"../abilities/Respawn":8,"../entities/bot/EggBot":19,"../entities/heroes/BotHero":20,"../entities/heroes/Player":22,"../entities/stills/Egg":52,"../entities/stills/MapBoundary":53,"../entities/stills/Rock":54,"../entities/stills/RockMineral":55,"../graphics/VShip":67,"../graphics/WShip":68,"../painter/Text":97,"../util/Constants":102,"../util/Noise":108,"../util/Number":109,"../util/Vector":113,"./MapGenerator":83}],85:[function(require,module,exports){
const MapGenerator = require('./MapGenerator');
const {NoiseSimplex} = require('../util/Noise');
const Player = require('../entities/heroes/Player');
const {rand, round} = require('../util/Number');
const MapBoundary = require('../entities/stills/MapBoundary');
const Rock = require('../entities/stills/Rock');
const RockMineral = require('../entities/stills/RockMineral');
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

class MapGeneratorStaged extends MapGenerator {
	constructor(map) {
		super(map);

		this.occupiedNoise = new NoiseSimplex(2);
		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.stageEntities = [];
		this.stage = 0;

		this.player = Player.defaultConstructor();
		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		map.addPlayer(this.player);
		map.addUi(this);
	}

	update() {
		super.udpate();
		if (this.stageEntities.every(entity => entity.health.isEmpty())) {
			let entities = this.createMonsters(this.stage++);
			entities.forEach(([entity, ui]) => {
				while (!entity.checkPosition(this.map.intersectionFinder)) {
					let position = this.occupiedNoise.positions(1, WIDTH, HEIGHT)[0];
					entity.setPosition(...position);
				}
				this.map.addMonster(entity, ui);
			});
			this.player.restoreHealth();
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

	paintUi(painter, camera) {
		let font = {size: '16px', align: 'right'};
		painter.add(new Text(
			1 - Positions.MARGIN,
			Positions.MARGIN * 2 + Positions.BAR_HEIGHT * 2,
			`${this.stage} : ${round(this.timer / 100)}`, font));
	}
}

module.exports = MapGeneratorStaged;

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

},{"../entities/heroes/Player":22,"../entities/monsters/Champion":39,"../entities/monsters/mechanicalFaction/AimingLaserTurret":42,"../entities/monsters/mechanicalFaction/BombLayer":43,"../entities/monsters/mechanicalFaction/DashChaser":44,"../entities/monsters/mechanicalFaction/ExplodingTick":45,"../entities/monsters/mechanicalFaction/MechanicalBoss":46,"../entities/monsters/mechanicalFaction/MechanicalBossEarly":47,"../entities/monsters/mechanicalFaction/SniperTick":48,"../entities/monsters/mechanicalFaction/Static4DirTurret":49,"../entities/stills/MapBoundary":53,"../entities/stills/Rock":54,"../entities/stills/RockMineral":55,"../painter/Text":97,"../util/Constants":102,"../util/Noise":108,"../util/Number":109,"./MapGenerator":83}],86:[function(require,module,exports){
const MapGenerator = require('./MapGenerator');
const {NoiseSimplex} = require('../util/Noise');
const Player = require('../entities/heroes/Player');
const {clamp, rand} = require('../util/Number');
const MapBoundary = require('../entities/stills/MapBoundary');
const Rock = require('../entities/stills/Rock');
const RockMineral = require('../entities/stills/RockMineral');
const Champion = require('../entities/monsters/Champion');
const ExplodingTick = require('../entities/monsters/mechanicalFaction/ExplodingTick');
const SniperTick = require('../entities/monsters/mechanicalFaction/SniperTick');
const Static4DirTurret = require('../entities/monsters/mechanicalFaction/Static4DirTurret');
const AimingLaserTurret = require('../entities/monsters/mechanicalFaction/AimingLaserTurret');
const MechanicalBossEarly = require('../entities/monsters/mechanicalFaction/MechanicalBossEarly');
const BombLayer = require('../entities/monsters/mechanicalFaction/BombLayer');
const DashChaser = require('../entities/monsters/mechanicalFaction/DashChaser');
const MechanicalBoss = require('../entities/monsters/mechanicalFaction/MechanicalBoss');

const WIDTH = 1.5, HEIGHT = 1.5;
const SPAWN_DIST = 3 / 4;

const SPAWNS = [
	{
		monsterClass: ExplodingTick,
		rampStart: 2,
		rampEnd: 3,
		weight: 30,
	},
	{
		monsterClass: SniperTick,
		rampStart: 6,
		rampEnd: 10,
		weight: 20,
	},
	{
		monsterClass: Static4DirTurret,
		rampStart: 8,
		rampEnd: 12,
		weight: 10,
	},
	{
		monsterClass: AimingLaserTurret,
		rampStart: 10,
		rampEnd: 14,
		weight: 10,
	},
	{
		monsterClass: MechanicalBossEarly,
		rampStart: 12,
		rampEnd: 20,
		weight: 1,
	},
	{
		monsterClass: BombLayer,
		rampStart: 16,
		rampEnd: 20,
		weight: 10,
	},
	{
		monsterClass: DashChaser,
		rampStart: 18,
		rampEnd: 22,
		weight: 10,
	},
	{
		monsterClass: MechanicalBoss,
		rampStart: 20,
		rampEnd: 29,
		weight: .3,
	},
];

class MapGeneratorTimed extends MapGenerator {
	constructor(map) {
		super(map);

		this.occupiedNoise = new NoiseSimplex(2);
		this.rockNoise = new NoiseSimplex(5);

		map.setSize(WIDTH, HEIGHT);

		this.generateBoundaries();
		this.generateRocks();

		this.weightAccumulated = 0;
		this.pendingMonsters = [];

		this.player = Player.defaultConstructor();
		this.player.setPosition(WIDTH * SPAWN_DIST, HEIGHT * SPAWN_DIST);
		map.addPlayer(this.player);
		map.addUi(this);
	}

	update() {
		super.update();
		this.pendingMonsters.push(...this.createMonsters());
		while (this.pendingMonsters.length) {
			let [entity, ui] = this.pendingMonsters[0];
			let foundPosition;
			for (let tryI = 0; tryI < 3 && !foundPosition; tryI++) {
				let position = this.occupiedNoise.positions(1, WIDTH, HEIGHT)[0];
				entity.setPosition(...position);
				foundPosition = entity.checkPosition(this.map.intersectionFinder);
			}
			if (!foundPosition)
				return;
			this.map.addMonster(entity, ui);
			this.pendingMonsters.pop();
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

	createMonsters() {
		let stage = this.timer / 100;
		let spawnEvery = .9 ** (stage / 10) * 20;
		this.weightAccumulated += rand(1 / spawnEvery);
		let weights = SPAWNS.map(spawn =>
			clamp((stage - spawn.rampStart) / (spawn.rampEnd - spawn.rampStart), 0, 1) * spawn.weight);
		let weightsSum = weights.reduce((sum, weight) => sum + weight);
		let spawns = [];
		while (this.weightAccumulated > 1) {
			this.weightAccumulated--;
			let spawnPick = rand(weightsSum);
			let spawnIndex = weights.findIndex(weight => {
				spawnPick -= weight;
				return spawnPick < 0;
			});
			if (spawnIndex >= 0)
				spawns.push([new SPAWNS[spawnIndex].monsterClass(), false]);
		}
		return spawns;
	}
}

module.exports = MapGeneratorTimed;

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

},{"../entities/heroes/Player":22,"../entities/monsters/Champion":39,"../entities/monsters/mechanicalFaction/AimingLaserTurret":42,"../entities/monsters/mechanicalFaction/BombLayer":43,"../entities/monsters/mechanicalFaction/DashChaser":44,"../entities/monsters/mechanicalFaction/ExplodingTick":45,"../entities/monsters/mechanicalFaction/MechanicalBoss":46,"../entities/monsters/mechanicalFaction/MechanicalBossEarly":47,"../entities/monsters/mechanicalFaction/SniperTick":48,"../entities/monsters/mechanicalFaction/Static4DirTurret":49,"../entities/stills/MapBoundary":53,"../entities/stills/Rock":54,"../entities/stills/RockMineral":55,"../util/Noise":108,"../util/Number":109,"./MapGenerator":83}],87:[function(require,module,exports){
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

},{"../camera/Camera":9,"../control/Keymapping":11,"../painter/Rect":95,"../painter/RectC":96,"../util/Constants":102}],88:[function(require,module,exports){
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

},{"./PainterElement":93,"./Rect":95}],89:[function(require,module,exports){
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

},{"./PainterElement":93,"./Rect":95}],90:[function(require,module,exports){
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

},{"../util/Vector":113,"./Path":94}],91:[function(require,module,exports){
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

},{}],92:[function(require,module,exports){
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

		this.context.fillStyle = 'white';
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.drawImage(this.painter.canvas, 0, 0);
		this.context.drawImage(this.uiPainter.canvas, 0, 0);
	}
}

module.exports = PainterCompositor;

},{"./Painter":91}],93:[function(require,module,exports){
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

},{"../util/Color":101}],94:[function(require,module,exports){
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

},{"./PainterElement":93}],95:[function(require,module,exports){
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

	static withCamera(camera, x, y, width, height, {fill, color, thickness = 1} = {}) {
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

},{"./PainterElement":93}],96:[function(require,module,exports){
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

},{"./Rect":95}],97:[function(require,module,exports){
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

	static withCamera(camera, x, y, text, {color, size, align} = {}) {
		return new Text(camera.xt(x), camera.yt(y), text, {color, size, align});
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

},{"./PainterElement":93}],98:[function(require,module,exports){
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

},{"../painter/RectC":96,"../util/Constants":102,"../util/Number":109}],99:[function(require,module,exports){
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

},{"../painter/RectC":96,"../util/Number":109,"./Star":98}],100:[function(require,module,exports){
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

},{"../painter/RectC":96,"../util/Noise":108,"../util/Number":109,"./Star":98,"./Starfield":99}],101:[function(require,module,exports){
const {clamp} = require('./Number');

const SHADE_ADD = .2;

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

	multiplyFromWhite(mult) {
		return new Color(
			255 - (255 - this.r) * mult,
			255 - (255 - this.g) * mult,
			255 - (255 - this.b) * mult,
			this.a);
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

},{"./Number":109}],102:[function(require,module,exports){
const Color = require('./Color');

const Colors = {
	// todo [medium] structure these constants

	// bars
	BAR_SHADING: 1,
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

	// buffs
	PLAYER_BUFFS: {
		DEAD: Color.from1(.5, .5, .5),
	},

	Interface: {
		INACTIVE: Color.from1(1, 1, 1),
		HOVER: Color.from1(.95, .95, .95),
		ACTIVE: Color.from1(1, 1, 1),
	},

	Entity: {
		MAP_BOUNDARY: Color.fromHexString('#ccc'),
		ROCK: Color.fromHexString('#888'),
		ROCK_MINERAL: Color.fromHexString('#8b8'),
		EGG: Color.fromHexString('#68b'),
		PLAYER: Color.fromHexString('#888'),
		PLAYER_GREEN: Color.fromHexString('#638d59'),
		FRIENDLY: Color.fromHexString('#63bd59'),
		MONSTER: Color.fromHexString('#bd6359'),
		FRIENDLY_PROJECTILE: Color.fromHexString('#6c6'),
		HOSTILE_PROJECTILE: Color.fromHexString('#c66'),
		Bomb: {
			WARNING_BORDER: Color.fromHexString('#cc8f52'),
			ENTITY: Color.fromHexString('#00c')
		},
		AREA_DEGEN: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .1)
		},
		DUST: Color.fromHexString('#ccc'),
		DAMAGE_DUST: Color.fromHexString('#f88'),
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
		BLUE: Color.from1(.5, .5, .75),
	},

	Minimap: {
		BACKGROUND: Color.from1(1, 1, 1, .5),
		BORDER: Color.from1(0, 0, 0, .5),
		ROCK: Color.from1(0, 0, 0),
		MONSTER: Color.from1(1, 0, 0),
		BOSS: Color.from1(1, 0, .6),
		PLAYER: Color.from1(0, 0, 1),
	}
};

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .02,
	PLAYER_BAR_X: .5,
	ABILITY_SIZE: .06,
	ABILITY_CHANNEL_BAR_SIZE: .01,
	BUFF_SIZE: .05,
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

},{"./Color":101}],103:[function(require,module,exports){
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

},{}],104:[function(require,module,exports){
const makeEnum = (...values) => {
	let enumb = {};
	values.forEach((value, index) => enumb[value] = index);
	return enumb;
};

module.exports = makeEnum;

},{}],105:[function(require,module,exports){
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

},{"./Number":109}],106:[function(require,module,exports){
class Item {
    constructor(value, prev) {
        this.value = value;
        this.prev = prev;
    }
}

module.exports = Item;

},{}],107:[function(require,module,exports){
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

	[Symbol.iterator]() {
		let iter = this.head;
		return {
			next: () => {
				if (!iter)
					return {done: true};
				let value = iter.value;
				iter = iter.next;
				return {value, done: false};
			}
		};
	}
}

module.exports = LinkedList;

},{"./Item":106}],108:[function(require,module,exports){
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

},{"./Number":109,"simplex-noise":1}],109:[function(require,module,exports){
const EPSILON = 1e-10, PI = Math.PI, PI2 = PI * 2;

const minWhich = (i, j) => i < j ? [i, 0] : [j, 1];

const maxWhich = (i, j) => i > j ? [i, 0] : [j, 1];

const minWhichA = arr => arr.reduce((minI, v, i, a) => v < a[minI] ? i : minI, 0);

const maxWhichA = arr => arr.reduce((maxI, v, i, a) => v > a[maxI] ? i : maxI, 0);

const getDiamondDistance = (x, y) => Math.abs(x) + Math.abs(y);

const getRectDistance = (x, y) => Math.max(Math.abs(x), Math.abs(y));

// todo [medium] deprecated
// todo [medium] replace getMagnitude uses with getMagnitudeSqr where possible
const getMagnitudeSqr = ({x, y}) => x * x + y * y;

// todo [medium] deprecated
const getMagnitude = (x, y) => Math.sqrt(getMagnitudeSqr({x, y}));

// todo [medium] deprecated
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

// todo [medium] deprecated
const thetaToVector = (theta, magnitude = 1) => [cos(theta) * magnitude, sin(theta) * magnitude];

const cos = theta => Math.cos(theta);

const sin = theta => Math.sin(theta);

const booleanArray = array => array.some(a => a);

const avg = (a, b, weight = .5) => a * weight + b * (1 - weight);

// [0, max)
const rand = (max = 1) => Math.random() * max;

// [-max/2, max/2)
const randB = (max = 1) => rand(max) - max / 2;

// [0, max)
const randInt = max => Math.floor(rand(max));

// todo [medium] deprecated
const randVector = magnitude =>
	thetaToVector(rand(PI2), rand(magnitude));

// todo [medium] deprecated
const vectorDelta = (a, b) => ({x: b.x - a.x, y: b.y - a.y});

// todo [medium] deprecated
const vectorSum = (...vs) =>
	vs.reduce((v, sum) => ({x: sum.x + v.x, y: sum.y + v.y}), {x: 0, y: 0});

const floor = number => Math.floor(number);

const round = (number, precision = 0) => {
	let ten = 10 ** precision;
	return Math.round(number * ten) / ten;
};

module.exports = {
	EPSILON,
	PI,
	PI2,
	minWhich,
	maxWhich,
	minWhichA,
	maxWhichA,
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
	floor,
	round,
};

// todo [medium] consistent return {x, y} for vectors instead of [x, y] for some
// todo [medium] consistent input ({x, y}) for vectors instead of (x, y)

},{}],110:[function(require,module,exports){
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

},{"./Number":109}],111:[function(require,module,exports){
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

},{"./Number":109}],112:[function(require,module,exports){
let record = (ms = 0) => {
	let stream = canvas.captureStream(20);
	let recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
	let data = [];

	recorder.addEventListener('dataavailable', event => data.push(event.data));

	recorder.addEventListener('stop', () => {
		let blob = new Blob(data, {type: 'video/webm'});
		let exportUrl = URL.createObjectURL(blob);
		window.open(exportUrl, '_blank');
	});

	let stop = () => {
		recorder.stop();
		stream.getTracks().forEach(track => track.stop());
	};

	if (ms)
		setTimeout(() => stop, ms);
	recorder.start();

	return stop;
};

module.exports = record;

},{}],113:[function(require,module,exports){
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

	// positive if v is clockwise of this
	cross(v) {
		return this.x * v.y - this.y * v.x;
	}

	get magnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

	// todo [medium] check if any uses of magnitude can be replaced with magnitudeSqr
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

},{"./Number":109}],114:[function(require,module,exports){
const Looper = require('../logic/Looper');
const Game = require('../logic/Game');
const GameEgg = require('../logic/GameEgg');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');
const RecordMp4 = require('../util/RecordMp4');

let canvas = document.querySelector('#canvas');
let logicButtonsRow = document.querySelector('#logic-buttons-row');
let looper = new Looper(canvas);

let logicCLasses = [
	Game,
	GameEgg,
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

// window.r = RecordMp4;
// window.s = RecordMp4();

},{"../logic/Game":73,"../logic/GameEgg":74,"../logic/GraphicsDemo":75,"../logic/InterfaceDemo":76,"../logic/Looper":78,"../logic/MapDemo":79,"../logic/NoiseDemo":80,"../logic/StarfieldDemo":81,"../util/RecordMp4":112}]},{},[114])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc2ltcGxleC1ub2lzZS9zaW1wbGV4LW5vaXNlLmpzIiwic3JjL2FiaWxpdGllcy9BYmlsaXR5LmpzIiwic3JjL2FiaWxpdGllcy9EYXNoLmpzIiwic3JjL2FiaWxpdGllcy9EZWxheWVkUmVnZW4uanMiLCJzcmMvYWJpbGl0aWVzL0luY0RlZmVuc2UuanMiLCJzcmMvYWJpbGl0aWVzL1Bhc3NpdmVBYmlsaXR5LmpzIiwic3JjL2FiaWxpdGllcy9Qcm9qZWN0aWxlQXR0YWNrLmpzIiwic3JjL2FiaWxpdGllcy9SZXNwYXduLmpzIiwic3JjL2NhbWVyYS9DYW1lcmEuanMiLCJzcmMvY29udHJvbC9Db250cm9sbGVyLmpzIiwic3JjL2NvbnRyb2wvS2V5bWFwcGluZy5qcyIsInNyYy9jb250cm9sL1N0YXRlLmpzIiwic3JjL2VudGl0aWVzL0J1ZmYuanMiLCJzcmMvZW50aXRpZXMvRW50aXR5LmpzIiwic3JjL2VudGl0aWVzL0xpdmluZ0VudGl0eS5qcyIsInNyYy9lbnRpdGllcy9hdHRhY2svQXJlYURlZ2VuLmpzIiwic3JjL2VudGl0aWVzL2F0dGFjay9MYXNlci5qcyIsInNyYy9lbnRpdGllcy9hdHRhY2svUHJvamVjdGlsZS5qcyIsInNyYy9lbnRpdGllcy9ib3QvRWdnQm90LmpzIiwic3JjL2VudGl0aWVzL2hlcm9lcy9Cb3RIZXJvLmpzIiwic3JjL2VudGl0aWVzL2hlcm9lcy9IZXJvLmpzIiwic3JjL2VudGl0aWVzL2hlcm9lcy9QbGF5ZXIuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9BaW0uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9BcmVhRGVnZW5MYXllci5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGVzL0NoYXNlLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZXMvQ29vbGRvd24uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9EYXNoLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZXMvRGlzdGFuY2UuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9Nb2R1bGUuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9Nb2R1bGVNYW5hZ2VyLmpzIiwic3JjL2VudGl0aWVzL21vZHVsZXMvTmVhcmJ5RGVnZW4uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9QYXR0ZXJuZWRQZXJpb2QuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9QZXJpb2QuanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9Qb3NpdGlvbi5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGVzL1JvdGF0ZS5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGVzL1Nob3RndW4uanMiLCJzcmMvZW50aXRpZXMvbW9kdWxlcy9TdGF0aWNMYXNlci5qcyIsInNyYy9lbnRpdGllcy9tb2R1bGVzL1RyaWdnZXIuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvQ2hhbXBpb24uanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvTW9uc3Rlci5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9Nb25zdGVyS25vd2xlZGdlLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0FpbWluZ0xhc2VyVHVycmV0LmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0JvbWJMYXllci5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9EYXNoQ2hhc2VyLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0V4cGxvZGluZ1RpY2suanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vTWVjaGFuaWNhbEJvc3MuanMiLCJzcmMvZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vTWVjaGFuaWNhbEJvc3NFYXJseS5qcyIsInNyYy9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9TbmlwZXJUaWNrLmpzIiwic3JjL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL1N0YXRpYzREaXJUdXJyZXQuanMiLCJzcmMvZW50aXRpZXMvcGFydGljbGVzL0RhbWFnZUR1c3QuanMiLCJzcmMvZW50aXRpZXMvcGFydGljbGVzL0R1c3QuanMiLCJzcmMvZW50aXRpZXMvc3RpbGxzL0VnZy5qcyIsInNyYy9lbnRpdGllcy9zdGlsbHMvTWFwQm91bmRhcnkuanMiLCJzcmMvZW50aXRpZXMvc3RpbGxzL1JvY2suanMiLCJzcmMvZW50aXRpZXMvc3RpbGxzL1JvY2tNaW5lcmFsLmpzIiwic3JjL2dyYXBoaWNzL0RpYW1vbmRTaGlwLmpzIiwic3JjL2dyYXBoaWNzL0RvdWJsZUhvcml6RGlhbW9uZFNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvR3JhcGhpY3MuanMiLCJzcmMvZ3JhcGhpY3MvSGV4YWdvblNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvUGF0aENyZWF0b3IuanMiLCJzcmMvZ3JhcGhpY3MvUmVjdDFEb3RzU2hpcC5qcyIsInNyYy9ncmFwaGljcy9SZWN0NERvdHNTaGlwLmpzIiwic3JjL2dyYXBoaWNzL1JlY3RHcmFwaGljLmpzIiwic3JjL2dyYXBoaWNzL1JvY2tHcmFwaGljLmpzIiwic3JjL2dyYXBoaWNzL1NwbGl0RGlhbW9uZFNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvVGVzdFNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvVlNoaXAuanMiLCJzcmMvZ3JhcGhpY3MvV1NoaXAuanMiLCJzcmMvaW50ZXJmYWNlL0J1dHRvbi5qcyIsInNyYy9pbnRlcmZhY2UvSW50ZXJmYWNlLmpzIiwic3JjL2ludGVyc2VjdGlvbi9Cb3VuZHMuanMiLCJzcmMvaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlci5qcyIsInNyYy9sb2dpYy9HYW1lLmpzIiwic3JjL2xvZ2ljL0dhbWVFZ2cuanMiLCJzcmMvbG9naWMvR3JhcGhpY3NEZW1vLmpzIiwic3JjL2xvZ2ljL0ludGVyZmFjZURlbW8uanMiLCJzcmMvbG9naWMvTG9naWMuanMiLCJzcmMvbG9naWMvTG9vcGVyLmpzIiwic3JjL2xvZ2ljL01hcERlbW8uanMiLCJzcmMvbG9naWMvTm9pc2VEZW1vLmpzIiwic3JjL2xvZ2ljL1N0YXJmaWVsZERlbW8uanMiLCJzcmMvbWFwL01hcC5qcyIsInNyYy9tYXAvTWFwR2VuZXJhdG9yLmpzIiwic3JjL21hcC9NYXBHZW5lcmF0b3JFZ2cuanMiLCJzcmMvbWFwL01hcEdlbmVyYXRvclN0YWdlZC5qcyIsInNyYy9tYXAvTWFwR2VuZXJhdG9yVGltZWQuanMiLCJzcmMvbWFwL01pbmltYXAuanMiLCJzcmMvcGFpbnRlci9CYXIuanMiLCJzcmMvcGFpbnRlci9CYXJDLmpzIiwic3JjL3BhaW50ZXIvTGluZS5qcyIsInNyYy9wYWludGVyL1BhaW50ZXIuanMiLCJzcmMvcGFpbnRlci9QYWludGVyQ29tcG9zaXRvci5qcyIsInNyYy9wYWludGVyL1BhaW50ZXJFbGVtZW50LmpzIiwic3JjL3BhaW50ZXIvUGF0aC5qcyIsInNyYy9wYWludGVyL1JlY3QuanMiLCJzcmMvcGFpbnRlci9SZWN0Qy5qcyIsInNyYy9wYWludGVyL1RleHQuanMiLCJzcmMvc3RhcmZpZWxkL1N0YXIuanMiLCJzcmMvc3RhcmZpZWxkL1N0YXJmaWVsZC5qcyIsInNyYy9zdGFyZmllbGQvU3RhcmZpZWxkTm9pc2UuanMiLCJzcmMvdXRpbC9Db2xvci5qcyIsInNyYy91dGlsL0NvbnN0YW50cy5qcyIsInNyYy91dGlsL0RlY2F5LmpzIiwic3JjL3V0aWwvRW51bS5qcyIsInNyYy91dGlsL0Zwc1RyYWNrZXIuanMiLCJzcmMvdXRpbC9JdGVtLmpzIiwic3JjL3V0aWwvTGlua2VkTGlzdC5qcyIsInNyYy91dGlsL05vaXNlLmpzIiwic3JjL3V0aWwvTnVtYmVyLmpzIiwic3JjL3V0aWwvUGhhc2UuanMiLCJzcmMvdXRpbC9Qb29sLmpzIiwic3JjL3V0aWwvUmVjb3JkTXA0LmpzIiwic3JjL3V0aWwvVmVjdG9yLmpzIiwic3JjL3ZpZXcvQ2FudmFzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDck1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxuICogQSBmYXN0IGphdmFzY3JpcHQgaW1wbGVtZW50YXRpb24gb2Ygc2ltcGxleCBub2lzZSBieSBKb25hcyBXYWduZXJcblxuQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbkJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG5cblxuIENvcHlyaWdodCAoYykgMjAxOCBKb25hcyBXYWduZXJcblxuIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG4gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuIFNPRlRXQVJFLlxuICovXG4oZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICB2YXIgRjIgPSAwLjUgKiAoTWF0aC5zcXJ0KDMuMCkgLSAxLjApO1xuICB2YXIgRzIgPSAoMy4wIC0gTWF0aC5zcXJ0KDMuMCkpIC8gNi4wO1xuICB2YXIgRjMgPSAxLjAgLyAzLjA7XG4gIHZhciBHMyA9IDEuMCAvIDYuMDtcbiAgdmFyIEY0ID0gKE1hdGguc3FydCg1LjApIC0gMS4wKSAvIDQuMDtcbiAgdmFyIEc0ID0gKDUuMCAtIE1hdGguc3FydCg1LjApKSAvIDIwLjA7XG5cbiAgZnVuY3Rpb24gU2ltcGxleE5vaXNlKHJhbmRvbU9yU2VlZCkge1xuICAgIHZhciByYW5kb207XG4gICAgaWYgKHR5cGVvZiByYW5kb21PclNlZWQgPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmFuZG9tID0gcmFuZG9tT3JTZWVkO1xuICAgIH1cbiAgICBlbHNlIGlmIChyYW5kb21PclNlZWQpIHtcbiAgICAgIHJhbmRvbSA9IGFsZWEocmFuZG9tT3JTZWVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmFuZG9tID0gTWF0aC5yYW5kb207XG4gICAgfVxuICAgIHRoaXMucCA9IGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pO1xuICAgIHRoaXMucGVybSA9IG5ldyBVaW50OEFycmF5KDUxMik7XG4gICAgdGhpcy5wZXJtTW9kMTIgPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNTEyOyBpKyspIHtcbiAgICAgIHRoaXMucGVybVtpXSA9IHRoaXMucFtpICYgMjU1XTtcbiAgICAgIHRoaXMucGVybU1vZDEyW2ldID0gdGhpcy5wZXJtW2ldICUgMTI7XG4gICAgfVxuXG4gIH1cbiAgU2ltcGxleE5vaXNlLnByb3RvdHlwZSA9IHtcbiAgICBncmFkMzogbmV3IEZsb2F0MzJBcnJheShbMSwgMSwgMCxcbiAgICAgIC0xLCAxLCAwLFxuICAgICAgMSwgLTEsIDAsXG5cbiAgICAgIC0xLCAtMSwgMCxcbiAgICAgIDEsIDAsIDEsXG4gICAgICAtMSwgMCwgMSxcblxuICAgICAgMSwgMCwgLTEsXG4gICAgICAtMSwgMCwgLTEsXG4gICAgICAwLCAxLCAxLFxuXG4gICAgICAwLCAtMSwgMSxcbiAgICAgIDAsIDEsIC0xLFxuICAgICAgMCwgLTEsIC0xXSksXG4gICAgZ3JhZDQ6IG5ldyBGbG9hdDMyQXJyYXkoWzAsIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLFxuICAgICAgMCwgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLFxuICAgICAgMSwgMCwgMSwgMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAxLCAxLCAwLCAtMSwgLTEsXG4gICAgICAtMSwgMCwgMSwgMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsIDEsIC0xLCAwLCAtMSwgLTEsXG4gICAgICAxLCAxLCAwLCAxLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIDEsIDEsIC0xLCAwLCAtMSxcbiAgICAgIC0xLCAxLCAwLCAxLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMCwgMSwgLTEsIC0xLCAwLCAtMSxcbiAgICAgIDEsIDEsIDEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgMSwgMCwgMSwgLTEsIC0xLCAwLFxuICAgICAgLTEsIDEsIDEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLCAxLCAwLCAtMSwgLTEsIC0xLCAwXSksXG4gICAgbm9pc2UyRDogZnVuY3Rpb24oeGluLCB5aW4pIHtcbiAgICAgIHZhciBwZXJtTW9kMTIgPSB0aGlzLnBlcm1Nb2QxMjtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQzID0gdGhpcy5ncmFkMztcbiAgICAgIHZhciBuMCA9IDA7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIG4xID0gMDtcbiAgICAgIHZhciBuMiA9IDA7XG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4pICogRjI7IC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqKSAqIEcyO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgeDAgPSB4aW4gLSBYMDsgLy8gVGhlIHgseSBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgLy8gRm9yIHRoZSAyRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhbiBlcXVpbGF0ZXJhbCB0cmlhbmdsZS5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCAobWlkZGxlKSBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqKSBjb29yZHNcbiAgICAgIGlmICh4MCA+IHkwKSB7XG4gICAgICAgIGkxID0gMTtcbiAgICAgICAgajEgPSAwO1xuICAgICAgfSAvLyBsb3dlciB0cmlhbmdsZSwgWFkgb3JkZXI6ICgwLDApLT4oMSwwKS0+KDEsMSlcbiAgICAgIGVsc2Uge1xuICAgICAgICBpMSA9IDA7XG4gICAgICAgIGoxID0gMTtcbiAgICAgIH0gLy8gdXBwZXIgdHJpYW5nbGUsIFlYIG9yZGVyOiAoMCwwKS0+KDAsMSktPigxLDEpXG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG4gICAgICAvLyBjID0gKDMtc3FydCgzKSkvNlxuICAgICAgdmFyIHgxID0geDAgLSBpMSArIEcyOyAvLyBPZmZzZXRzIGZvciBtaWRkbGUgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEcyO1xuICAgICAgdmFyIHgyID0geDAgLSAxLjAgKyAyLjAgKiBHMjsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIDEuMCArIDIuMCAqIEcyO1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSB0aHJlZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC41IC0geDAgKiB4MCAtIHkwICogeTA7XG4gICAgICBpZiAodDAgPj0gMCkge1xuICAgICAgICB2YXIgZ2kwID0gcGVybU1vZDEyW2lpICsgcGVybVtqal1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwKTsgLy8gKHgseSkgb2YgZ3JhZDMgdXNlZCBmb3IgMkQgZ3JhZGllbnRcbiAgICAgIH1cbiAgICAgIHZhciB0MSA9IDAuNSAtIHgxICogeDEgLSB5MSAqIHkxO1xuICAgICAgaWYgKHQxID49IDApIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC41IC0geDIgKiB4MiAtIHkyICogeTI7XG4gICAgICBpZiAodDIgPj0gMCkge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgMSArIHBlcm1bamogKyAxXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gcmV0dXJuIHZhbHVlcyBpbiB0aGUgaW50ZXJ2YWwgWy0xLDFdLlxuICAgICAgcmV0dXJuIDcwLjAgKiAobjAgKyBuMSArIG4yKTtcbiAgICB9LFxuICAgIC8vIDNEIHNpbXBsZXggbm9pc2VcbiAgICBub2lzZTNEOiBmdW5jdGlvbih4aW4sIHlpbiwgemluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAsIG4xLCBuMiwgbjM7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZm91ciBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSBpbnB1dCBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggc2ltcGxleCBjZWxsIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4aW4gKyB5aW4gKyB6aW4pICogRjM7IC8vIFZlcnkgbmljZSBhbmQgc2ltcGxlIHNrZXcgZmFjdG9yIGZvciAzRFxuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHhpbiArIHMpO1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKHlpbiArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHppbiArIHMpO1xuICAgICAgdmFyIHQgPSAoaSArIGogKyBrKSAqIEczO1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHopIHNwYWNlXG4gICAgICB2YXIgWTAgPSBqIC0gdDtcbiAgICAgIHZhciBaMCA9IGsgLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkseiBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHlpbiAtIFkwO1xuICAgICAgdmFyIHowID0gemluIC0gWjA7XG4gICAgICAvLyBGb3IgdGhlIDNEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGEgc2xpZ2h0bHkgaXJyZWd1bGFyIHRldHJhaGVkcm9uLlxuICAgICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgICAgdmFyIGkxLCBqMSwgazE7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgdmFyIGkyLCBqMiwgazI7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGosaykgY29vcmRzXG4gICAgICBpZiAoeDAgPj0geTApIHtcbiAgICAgICAgaWYgKHkwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDA7XG4gICAgICAgIH0gLy8gWCBZIFogb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPj0gejApIHtcbiAgICAgICAgICBpMSA9IDE7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBYIFogWSBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAwO1xuICAgICAgICAgIGsxID0gMTtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAwO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBaIFggWSBvcmRlclxuICAgICAgfVxuICAgICAgZWxzZSB7IC8vIHgwPHkwXG4gICAgICAgIGlmICh5MCA8IHowKSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAwO1xuICAgICAgICAgIGoyID0gMTtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBZIFggb3JkZXJcbiAgICAgICAgZWxzZSBpZiAoeDAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFkgWiBYIG9yZGVyXG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDE7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFkgWCBaIG9yZGVyXG4gICAgICB9XG4gICAgICAvLyBBIHN0ZXAgb2YgKDEsMCwwKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jLC1jKSBpbiAoeCx5LHopLFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDEsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYywtYykgaW4gKHgseSx6KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMCwxKSBpbiAoaSxqLGspIG1lYW5zIGEgc3RlcCBvZiAoLWMsLWMsMS1jKSBpbiAoeCx5LHopLCB3aGVyZVxuICAgICAgLy8gYyA9IDEvNi5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMzsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEczO1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEczO1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEczOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MiA9IHkwIC0gajIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB6MiA9IHowIC0gazIgKyAyLjAgKiBHMztcbiAgICAgIHZhciB4MyA9IHgwIC0gMS4wICsgMy4wICogRzM7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTMgPSB5MCAtIDEuMCArIDMuMCAqIEczO1xuICAgICAgdmFyIHozID0gejAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZm91ciBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowO1xuICAgICAgaWYgKHQwIDwgMCkgbjAgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bamogKyBwZXJtW2trXV1dICogMztcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkM1tnaTBdICogeDAgKyBncmFkM1tnaTAgKyAxXSAqIHkwICsgZ3JhZDNbZ2kwICsgMl0gKiB6MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejE7XG4gICAgICBpZiAodDEgPCAwKSBuMSA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kxID0gcGVybU1vZDEyW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazFdXV0gKiAzO1xuICAgICAgICB0MSAqPSB0MTtcbiAgICAgICAgbjEgPSB0MSAqIHQxICogKGdyYWQzW2dpMV0gKiB4MSArIGdyYWQzW2dpMSArIDFdICogeTEgKyBncmFkM1tnaTEgKyAyXSAqIHoxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSBwZXJtTW9kMTJbaWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMl1dXSAqIDM7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDNbZ2kyXSAqIHgyICsgZ3JhZDNbZ2kyICsgMV0gKiB5MiArIGdyYWQzW2dpMiArIDJdICogejIpO1xuICAgICAgfVxuICAgICAgdmFyIHQzID0gMC42IC0geDMgKiB4MyAtIHkzICogeTMgLSB6MyAqIHozO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxXV1dICogMztcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkM1tnaTNdICogeDMgKyBncmFkM1tnaTMgKyAxXSAqIHkzICsgZ3JhZDNbZ2kzICsgMl0gKiB6Myk7XG4gICAgICB9XG4gICAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byBzdGF5IGp1c3QgaW5zaWRlIFstMSwxXVxuICAgICAgcmV0dXJuIDMyLjAgKiAobjAgKyBuMSArIG4yICsgbjMpO1xuICAgIH0sXG4gICAgLy8gNEQgc2ltcGxleCBub2lzZSwgYmV0dGVyIHNpbXBsZXggcmFuayBvcmRlcmluZyBtZXRob2QgMjAxMi0wMy0wOVxuICAgIG5vaXNlNEQ6IGZ1bmN0aW9uKHgsIHksIHosIHcpIHtcbiAgICAgIHZhciBwZXJtID0gdGhpcy5wZXJtO1xuICAgICAgdmFyIGdyYWQ0ID0gdGhpcy5ncmFkNDtcblxuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zLCBuNDsgLy8gTm9pc2UgY29udHJpYnV0aW9ucyBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIC8vIFNrZXcgdGhlICh4LHkseix3KSBzcGFjZSB0byBkZXRlcm1pbmUgd2hpY2ggY2VsbCBvZiAyNCBzaW1wbGljZXMgd2UncmUgaW5cbiAgICAgIHZhciBzID0gKHggKyB5ICsgeiArIHcpICogRjQ7IC8vIEZhY3RvciBmb3IgNEQgc2tld2luZ1xuICAgICAgdmFyIGkgPSBNYXRoLmZsb29yKHggKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5ICsgcyk7XG4gICAgICB2YXIgayA9IE1hdGguZmxvb3IoeiArIHMpO1xuICAgICAgdmFyIGwgPSBNYXRoLmZsb29yKHcgKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgayArIGwpICogRzQ7IC8vIEZhY3RvciBmb3IgNEQgdW5za2V3aW5nXG4gICAgICB2YXIgWDAgPSBpIC0gdDsgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICh4LHkseix3KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciBXMCA9IGwgLSB0O1xuICAgICAgdmFyIHgwID0geCAtIFgwOyAvLyBUaGUgeCx5LHosdyBkaXN0YW5jZXMgZnJvbSB0aGUgY2VsbCBvcmlnaW5cbiAgICAgIHZhciB5MCA9IHkgLSBZMDtcbiAgICAgIHZhciB6MCA9IHogLSBaMDtcbiAgICAgIHZhciB3MCA9IHcgLSBXMDtcbiAgICAgIC8vIEZvciB0aGUgNEQgY2FzZSwgdGhlIHNpbXBsZXggaXMgYSA0RCBzaGFwZSBJIHdvbid0IGV2ZW4gdHJ5IHRvIGRlc2NyaWJlLlxuICAgICAgLy8gVG8gZmluZCBvdXQgd2hpY2ggb2YgdGhlIDI0IHBvc3NpYmxlIHNpbXBsaWNlcyB3ZSdyZSBpbiwgd2UgbmVlZCB0b1xuICAgICAgLy8gZGV0ZXJtaW5lIHRoZSBtYWduaXR1ZGUgb3JkZXJpbmcgb2YgeDAsIHkwLCB6MCBhbmQgdzAuXG4gICAgICAvLyBTaXggcGFpci13aXNlIGNvbXBhcmlzb25zIGFyZSBwZXJmb3JtZWQgYmV0d2VlbiBlYWNoIHBvc3NpYmxlIHBhaXJcbiAgICAgIC8vIG9mIHRoZSBmb3VyIGNvb3JkaW5hdGVzLCBhbmQgdGhlIHJlc3VsdHMgYXJlIHVzZWQgdG8gcmFuayB0aGUgbnVtYmVycy5cbiAgICAgIHZhciByYW5reCA9IDA7XG4gICAgICB2YXIgcmFua3kgPSAwO1xuICAgICAgdmFyIHJhbmt6ID0gMDtcbiAgICAgIHZhciByYW5rdyA9IDA7XG4gICAgICBpZiAoeDAgPiB5MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3krKztcbiAgICAgIGlmICh4MCA+IHowKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5reisrO1xuICAgICAgaWYgKHgwID4gdzApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICBpZiAoeTAgPiB6MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh5MCA+IHcwKSByYW5reSsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHowID4gdzApIHJhbmt6Kys7XG4gICAgICBlbHNlIHJhbmt3Kys7XG4gICAgICB2YXIgaTEsIGoxLCBrMSwgbDE7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBzZWNvbmQgc2ltcGxleCBjb3JuZXJcbiAgICAgIHZhciBpMiwgajIsIGsyLCBsMjsgLy8gVGhlIGludGVnZXIgb2Zmc2V0cyBmb3IgdGhlIHRoaXJkIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTMsIGozLCBrMywgbDM7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSBmb3VydGggc2ltcGxleCBjb3JuZXJcbiAgICAgIC8vIHNpbXBsZXhbY10gaXMgYSA0LXZlY3RvciB3aXRoIHRoZSBudW1iZXJzIDAsIDEsIDIgYW5kIDMgaW4gc29tZSBvcmRlci5cbiAgICAgIC8vIE1hbnkgdmFsdWVzIG9mIGMgd2lsbCBuZXZlciBvY2N1ciwgc2luY2UgZS5nLiB4Pnk+ej53IG1ha2VzIHg8eiwgeTx3IGFuZCB4PHdcbiAgICAgIC8vIGltcG9zc2libGUuIE9ubHkgdGhlIDI0IGluZGljZXMgd2hpY2ggaGF2ZSBub24temVybyBlbnRyaWVzIG1ha2UgYW55IHNlbnNlLlxuICAgICAgLy8gV2UgdXNlIGEgdGhyZXNob2xkaW5nIHRvIHNldCB0aGUgY29vcmRpbmF0ZXMgaW4gdHVybiBmcm9tIHRoZSBsYXJnZXN0IG1hZ25pdHVkZS5cbiAgICAgIC8vIFJhbmsgMyBkZW5vdGVzIHRoZSBsYXJnZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMSA9IHJhbmt4ID49IDMgPyAxIDogMDtcbiAgICAgIGoxID0gcmFua3kgPj0gMyA/IDEgOiAwO1xuICAgICAgazEgPSByYW5reiA+PSAzID8gMSA6IDA7XG4gICAgICBsMSA9IHJhbmt3ID49IDMgPyAxIDogMDtcbiAgICAgIC8vIFJhbmsgMiBkZW5vdGVzIHRoZSBzZWNvbmQgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTIgPSByYW5reCA+PSAyID8gMSA6IDA7XG4gICAgICBqMiA9IHJhbmt5ID49IDIgPyAxIDogMDtcbiAgICAgIGsyID0gcmFua3ogPj0gMiA/IDEgOiAwO1xuICAgICAgbDIgPSByYW5rdyA+PSAyID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDEgZGVub3RlcyB0aGUgc2Vjb25kIHNtYWxsZXN0IGNvb3JkaW5hdGUuXG4gICAgICBpMyA9IHJhbmt4ID49IDEgPyAxIDogMDtcbiAgICAgIGozID0gcmFua3kgPj0gMSA/IDEgOiAwO1xuICAgICAgazMgPSByYW5reiA+PSAxID8gMSA6IDA7XG4gICAgICBsMyA9IHJhbmt3ID49IDEgPyAxIDogMDtcbiAgICAgIC8vIFRoZSBmaWZ0aCBjb3JuZXIgaGFzIGFsbCBjb29yZGluYXRlIG9mZnNldHMgPSAxLCBzbyBubyBuZWVkIHRvIGNvbXB1dGUgdGhhdC5cbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHNDsgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzQ7XG4gICAgICB2YXIgejEgPSB6MCAtIGsxICsgRzQ7XG4gICAgICB2YXIgdzEgPSB3MCAtIGwxICsgRzQ7XG4gICAgICB2YXIgeDIgPSB4MCAtIGkyICsgMi4wICogRzQ7IC8vIE9mZnNldHMgZm9yIHRoaXJkIGNvcm5lciBpbiAoeCx5LHosdykgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzQ7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzQ7XG4gICAgICB2YXIgdzIgPSB3MCAtIGwyICsgMi4wICogRzQ7XG4gICAgICB2YXIgeDMgPSB4MCAtIGkzICsgMy4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGZvdXJ0aCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSBqMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHozID0gejAgLSBrMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHczID0gdzAgLSBsMyArIDMuMCAqIEc0O1xuICAgICAgdmFyIHg0ID0geDAgLSAxLjAgKyA0LjAgKiBHNDsgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHk0ID0geTAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIHZhciB6NCA9IHowIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgdzQgPSB3MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgLy8gV29yayBvdXQgdGhlIGhhc2hlZCBncmFkaWVudCBpbmRpY2VzIG9mIHRoZSBmaXZlIHNpbXBsZXggY29ybmVyc1xuICAgICAgdmFyIGlpID0gaSAmIDI1NTtcbiAgICAgIHZhciBqaiA9IGogJiAyNTU7XG4gICAgICB2YXIga2sgPSBrICYgMjU1O1xuICAgICAgdmFyIGxsID0gbCAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIGZpdmUgY29ybmVyc1xuICAgICAgdmFyIHQwID0gMC42IC0geDAgKiB4MCAtIHkwICogeTAgLSB6MCAqIHowIC0gdzAgKiB3MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSAocGVybVtpaSArIHBlcm1bamogKyBwZXJtW2trICsgcGVybVtsbF1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgbjAgPSB0MCAqIHQwICogKGdyYWQ0W2dpMF0gKiB4MCArIGdyYWQ0W2dpMCArIDFdICogeTAgKyBncmFkNFtnaTAgKyAyXSAqIHowICsgZ3JhZDRbZ2kwICsgM10gKiB3MCk7XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjYgLSB4MSAqIHgxIC0geTEgKiB5MSAtIHoxICogejEgLSB3MSAqIHcxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IChwZXJtW2lpICsgaTEgKyBwZXJtW2pqICsgajEgKyBwZXJtW2trICsgazEgKyBwZXJtW2xsICsgbDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkNFtnaTFdICogeDEgKyBncmFkNFtnaTEgKyAxXSAqIHkxICsgZ3JhZDRbZ2kxICsgMl0gKiB6MSArIGdyYWQ0W2dpMSArIDNdICogdzEpO1xuICAgICAgfVxuICAgICAgdmFyIHQyID0gMC42IC0geDIgKiB4MiAtIHkyICogeTIgLSB6MiAqIHoyIC0gdzIgKiB3MjtcbiAgICAgIGlmICh0MiA8IDApIG4yID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTIgPSAocGVybVtpaSArIGkyICsgcGVybVtqaiArIGoyICsgcGVybVtrayArIGsyICsgcGVybVtsbCArIGwyXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQyICo9IHQyO1xuICAgICAgICBuMiA9IHQyICogdDIgKiAoZ3JhZDRbZ2kyXSAqIHgyICsgZ3JhZDRbZ2kyICsgMV0gKiB5MiArIGdyYWQ0W2dpMiArIDJdICogejIgKyBncmFkNFtnaTIgKyAzXSAqIHcyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MyAtIHczICogdzM7XG4gICAgICBpZiAodDMgPCAwKSBuMyA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kzID0gKHBlcm1baWkgKyBpMyArIHBlcm1bamogKyBqMyArIHBlcm1ba2sgKyBrMyArIHBlcm1bbGwgKyBsM11dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MyAqPSB0MztcbiAgICAgICAgbjMgPSB0MyAqIHQzICogKGdyYWQ0W2dpM10gKiB4MyArIGdyYWQ0W2dpMyArIDFdICogeTMgKyBncmFkNFtnaTMgKyAyXSAqIHozICsgZ3JhZDRbZ2kzICsgM10gKiB3Myk7XG4gICAgICB9XG4gICAgICB2YXIgdDQgPSAwLjYgLSB4NCAqIHg0IC0geTQgKiB5NCAtIHo0ICogejQgLSB3NCAqIHc0O1xuICAgICAgaWYgKHQ0IDwgMCkgbjQgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpNCA9IChwZXJtW2lpICsgMSArIHBlcm1bamogKyAxICsgcGVybVtrayArIDEgKyBwZXJtW2xsICsgMV1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0NCAqPSB0NDtcbiAgICAgICAgbjQgPSB0NCAqIHQ0ICogKGdyYWQ0W2dpNF0gKiB4NCArIGdyYWQ0W2dpNCArIDFdICogeTQgKyBncmFkNFtnaTQgKyAyXSAqIHo0ICsgZ3JhZDRbZ2k0ICsgM10gKiB3NCk7XG4gICAgICB9XG4gICAgICAvLyBTdW0gdXAgYW5kIHNjYWxlIHRoZSByZXN1bHQgdG8gY292ZXIgdGhlIHJhbmdlIFstMSwxXVxuICAgICAgcmV0dXJuIDI3LjAgKiAobjAgKyBuMSArIG4yICsgbjMgKyBuNCk7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGJ1aWxkUGVybXV0YXRpb25UYWJsZShyYW5kb20pIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgcCA9IG5ldyBVaW50OEFycmF5KDI1Nik7XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICBwW2ldID0gaTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IDI1NTsgaSsrKSB7XG4gICAgICB2YXIgciA9IGkgKyB+fihyYW5kb20oKSAqICgyNTYgLSBpKSk7XG4gICAgICB2YXIgYXV4ID0gcFtpXTtcbiAgICAgIHBbaV0gPSBwW3JdO1xuICAgICAgcFtyXSA9IGF1eDtcbiAgICB9XG4gICAgcmV0dXJuIHA7XG4gIH1cbiAgU2ltcGxleE5vaXNlLl9idWlsZFBlcm11dGF0aW9uVGFibGUgPSBidWlsZFBlcm11dGF0aW9uVGFibGU7XG5cbiAgZnVuY3Rpb24gYWxlYSgpIHtcbiAgICAvLyBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbiAgICB2YXIgczAgPSAwO1xuICAgIHZhciBzMSA9IDA7XG4gICAgdmFyIHMyID0gMDtcbiAgICB2YXIgYyA9IDE7XG5cbiAgICB2YXIgbWFzaCA9IG1hc2hlcigpO1xuICAgIHMwID0gbWFzaCgnICcpO1xuICAgIHMxID0gbWFzaCgnICcpO1xuICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHMwIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMCA8IDApIHtcbiAgICAgICAgczAgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMxIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMSA8IDApIHtcbiAgICAgICAgczEgKz0gMTtcbiAgICAgIH1cbiAgICAgIHMyIC09IG1hc2goYXJndW1lbnRzW2ldKTtcbiAgICAgIGlmIChzMiA8IDApIHtcbiAgICAgICAgczIgKz0gMTtcbiAgICAgIH1cbiAgICB9XG4gICAgbWFzaCA9IG51bGw7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICAgIHMwID0gczE7XG4gICAgICBzMSA9IHMyO1xuICAgICAgcmV0dXJuIHMyID0gdCAtIChjID0gdCB8IDApO1xuICAgIH07XG4gIH1cbiAgZnVuY3Rpb24gbWFzaGVyKCkge1xuICAgIHZhciBuID0gMHhlZmM4MjQ5ZDtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuICs9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgICAgdmFyIGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgaCAqPSBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuICAgICAgfVxuICAgICAgcmV0dXJuIChuID4+PiAwKSAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFtZFxuICBpZiAodHlwZW9mIGRlZmluZSAhPT0gJ3VuZGVmaW5lZCcgJiYgZGVmaW5lLmFtZCkgZGVmaW5lKGZ1bmN0aW9uKCkge3JldHVybiBTaW1wbGV4Tm9pc2U7fSk7XG4gIC8vIGNvbW1vbiBqc1xuICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSBleHBvcnRzLlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gYnJvd3NlclxuICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgd2luZG93LlNpbXBsZXhOb2lzZSA9IFNpbXBsZXhOb2lzZTtcbiAgLy8gbm9kZWpzXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gU2ltcGxleE5vaXNlO1xuICB9XG5cbn0pKCk7XG4iLCJjb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XHJcbmNvbnN0IEtleW1hcHBpbmcgPSByZXF1aXJlKCcuLi9jb250cm9sL0tleW1hcHBpbmcnKTtcclxuY29uc3Qge0NvbG9ycywgUG9zaXRpb25zfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3QnKTtcclxuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xyXG5jb25zdCBCYXIgPSByZXF1aXJlKCcuLi9wYWludGVyL0JhcicpO1xyXG5cclxuY2xhc3MgQWJpbGl0eSB7XHJcblx0Y29uc3RydWN0b3IoY29vbGRvd24sIGNoYXJnZXMsIHN0YW1pbmEsIGNoYW5uZWxTdGFtaW5hLCByZXBlYXRhYmxlLCBjaGFubmVsRHVyYXRpb24pIHtcclxuXHRcdHRoaXMuY29vbGRvd24gPSBuZXcgUG9vbChjb29sZG93biwgLTEpO1xyXG5cdFx0dGhpcy5jaGFyZ2VzID0gbmV3IFBvb2woY2hhcmdlcywgMSk7XHJcblx0XHR0aGlzLnN0YW1pbmEgPSBzdGFtaW5hO1xyXG5cdFx0dGhpcy5jaGFubmVsU3RhbWluYSA9IGNoYW5uZWxTdGFtaW5hO1xyXG5cdFx0dGhpcy5yZXBlYXRhYmxlID0gcmVwZWF0YWJsZTtcclxuXHRcdC8vIHRvZG8gW2xvd10gYWxsb3cgaW5kaWNhdGluZyB3aGV0aGVyIGNoYW5uZWwgd2lsbCBmb3JjZSBzdG9wIHVwb24gcmVhY2hpbmcgbWF4IG9yIHdpbGwgYWxsb3cgdG8gY29udGludWVcclxuXHRcdHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uID0gY2hhbm5lbER1cmF0aW9uOyAvLyAtMSBpbmRpY2F0ZXMgaW5maW5pdGUsIDAgaW5kaWNhdGVzIDEgdGljayAoaS5lLiBub3QgY2hhbm5lbGVkKVxyXG5cdFx0dGhpcy5jaGFubmVsRHVyYXRpb24gPSAwOyAvLyAwIG9uIHN0YXJ0LCAxLi4uIG9uIHN1YnNlcXVlbnQgY2FsbHNcclxuXHR9XHJcblxyXG5cdHNldFVpKHVpSW5kZXgpIHtcclxuXHRcdHRoaXMudWlJbmRleCA9IHVpSW5kZXg7XHJcblx0XHR0aGlzLnVpQ29sb3IgPSBDb2xvcnMuUExBWUVSX0FCSUxJVElFU1t1aUluZGV4XTtcclxuXHRcdHRoaXMudWlUZXh0ID0gS2V5bWFwcGluZy5nZXRLZXlzKEtleW1hcHBpbmcuQ29udHJvbHMuQUJJTElUWV9JW3VpSW5kZXhdKS5qb2luKCcvJyk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBoZXJvLCB3YW50QWN0aXZlKSB7XHJcblx0XHR0aGlzLnJlZnJlc2goaGVybyk7XHJcblx0XHRpZiAod2FudEFjdGl2ZSAmJiB0aGlzLnNhZmVBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pKVxyXG5cdFx0XHR0aGlzLmNoYW5uZWxEdXJhdGlvbisrO1xyXG5cdFx0ZWxzZSBpZiAodGhpcy5jaGFubmVsRHVyYXRpb24gIT09IDApIHtcclxuXHRcdFx0dGhpcy5lbmRBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pO1xyXG5cdFx0XHR0aGlzLmNoYW5uZWxEdXJhdGlvbiA9IDA7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZWZyZXNoKGhlcm8pIHtcclxuXHRcdGlmICghdGhpcy5jaGFyZ2VzLmlzRnVsbCgpICYmIHRoaXMuY29vbGRvd24uaW5jcmVtZW50KCkpIHtcclxuXHRcdFx0dGhpcy5jaGFyZ2VzLmluY3JlbWVudCgpO1xyXG5cdFx0XHR0aGlzLmNvb2xkb3duLnJlc3RvcmUoKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLnJlYWR5ID0gIXRoaXMuY2hhcmdlcy5pc0VtcHR5KCkgJiYgaGVyby5zdWZmaWNpZW50U3RhbWluYSh0aGlzLnN0YW1pbmEpICYmICh0aGlzLnJlcGVhdGFibGUgfHwgIXRoaXMucmVwZWF0aW5nKTtcclxuXHRcdHRoaXMucmVhZHlDaGFubmVsQ29udGludWUgPSB0aGlzLm1heENoYW5uZWxEdXJhdGlvbiAmJiB0aGlzLmNoYW5uZWxEdXJhdGlvbiAmJiBoZXJvLnN1ZmZpY2llbnRTdGFtaW5hKHRoaXMuY2hhbm5lbFN0YW1pbmEpO1xyXG5cdFx0dGhpcy5yZXBlYXRpbmcgPSBmYWxzZTtcclxuXHR9XHJcblxyXG5cdHNhZmVBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pIHtcclxuXHRcdHRoaXMucmVwZWF0aW5nID0gdHJ1ZTtcclxuXHRcdGlmICghdGhpcy5yZWFkeSAmJiAhdGhpcy5yZWFkeUNoYW5uZWxDb250aW51ZSlcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0aWYgKCF0aGlzLmFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgaGVybykpXHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRpZiAodGhpcy5yZWFkeSkge1xyXG5cdFx0XHR0aGlzLmNoYXJnZXMuY2hhbmdlKC0xKTtcclxuXHRcdFx0aGVyby5jb25zdW1lU3RhbWluYSh0aGlzLnN0YW1pbmEpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aGVyby5jb25zdW1lU3RhbWluYSh0aGlzLmNoYW5uZWxTdGFtaW5hKTtcclxuXHRcdFx0dGhpcy5jb29sZG93bi52YWx1ZSA9IHRoaXMuY29vbGRvd24ubWF4O1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG5cclxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pIHtcclxuXHRcdC8qIG92ZXJyaWRlICovXHJcblx0fVxyXG5cclxuXHRlbmRBY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pIHtcclxuXHRcdC8qIG92ZXJyaWRlICovXHJcblx0fVxyXG5cclxuXHRnZXQgY2hhbm5lbFJhdGlvKCkge1xyXG5cdFx0aWYgKHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uID4gMCAmJiB0aGlzLmNoYW5uZWxEdXJhdGlvbiA+IDApXHJcblx0XHRcdHJldHVybiBNYXRoLm1pbih0aGlzLmNoYW5uZWxEdXJhdGlvbiAvIHRoaXMubWF4Q2hhbm5lbER1cmF0aW9uLCAxKTtcclxuXHR9XHJcblxyXG5cdHBhaW50VWkocGFpbnRlciwgY2FtZXJhKSB7XHJcblx0XHQvLyBiYWNrZ3JvdW5kXHJcblx0XHRjb25zdCBTSVpFX1dJVEhfTUFSR0lOID0gUG9zaXRpb25zLkFCSUxJVFlfU0laRSArIFBvc2l0aW9ucy5NQVJHSU47XHJcblx0XHRjb25zdCBMRUZUID0gUG9zaXRpb25zLk1BUkdJTiArIHRoaXMudWlJbmRleCAqIFNJWkVfV0lUSF9NQVJHSU47XHJcblx0XHRjb25zdCBUT1AgPSAxIC0gU0laRV9XSVRIX01BUkdJTjtcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLnVpQ29sb3IuZ2V0U2hhZGUoKX0pKTtcclxuXHJcblx0XHQvLyBmb3JlZ3JvdW5kIGZvciBjdXJyZW50IGNoYXJnZXNcclxuXHRcdGNvbnN0IFJPV19IRUlHSFQgPSBQb3NpdGlvbnMuQUJJTElUWV9TSVpFIC8gdGhpcy5jaGFyZ2VzLmdldE1heCgpO1xyXG5cdFx0Y29uc3QgSEVJR0hUID0gdGhpcy5jaGFyZ2VzLmdldCgpICogUk9XX0hFSUdIVDtcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KExFRlQsIFRPUCArIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUgLSBIRUlHSFQsIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUsIEhFSUdIVCwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLnVpQ29sb3IuZ2V0KCl9KSk7XHJcblxyXG5cdFx0Ly8gaHlicmlkIGZvciBjdXJyZW50IGNvb2xkb3duXHJcblx0XHRpZiAoIXRoaXMuY29vbGRvd24uaXNGdWxsKCkpIHtcclxuXHRcdFx0bGV0IHNoYWRlID0gdGhpcy5jb29sZG93bi5nZXRSYXRpbygpO1xyXG5cdFx0XHRwYWludGVyLmFkZChuZXcgUmVjdChMRUZULCBUT1AgKyBQb3NpdGlvbnMuQUJJTElUWV9TSVpFIC0gSEVJR0hUIC0gUk9XX0hFSUdIVCwgUG9zaXRpb25zLkFCSUxJVFlfU0laRSwgUk9XX0hFSUdIVCwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLnVpQ29sb3IuZ2V0U2hhZGUoc2hhZGUpfSkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGJvcmRlclxyXG5cdFx0aWYgKCF0aGlzLnJlYWR5KVxyXG5cdFx0XHRwYWludGVyLmFkZChuZXcgUmVjdChMRUZULCBUT1AsIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUsIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUsIHtjb2xvcjogQ29sb3JzLlBMQVlFUl9BQklMSVRZX05PVF9SRUFEWS5nZXQoKSwgdGhpY2tuZXNzOiAyfSkpO1xyXG5cclxuXHRcdC8vIGxldHRlclxyXG5cdFx0cGFpbnRlci5hZGQobmV3IFRleHQoTEVGVCArIFBvc2l0aW9ucy5BQklMSVRZX1NJWkUgLyAyLCBUT1AgKyBQb3NpdGlvbnMuQUJJTElUWV9TSVpFIC8gMiwgdGhpcy51aVRleHQpKTtcclxuXHJcblx0XHQvLyBjaGFubmVsIGJhclxyXG5cdFx0bGV0IGNoYW5uZWxSYXRpbyA9IHRoaXMuY2hhbm5lbFJhdGlvO1xyXG5cdFx0aWYgKGNoYW5uZWxSYXRpbylcclxuXHRcdFx0cGFpbnRlci5hZGQobmV3IEJhcihMRUZULCBUT1AgLSBQb3NpdGlvbnMuQUJJTElUWV9DSEFOTkVMX0JBUl9TSVpFIC0gUG9zaXRpb25zLk1BUkdJTiAvIDIsXHJcblx0XHRcdFx0UG9zaXRpb25zLkFCSUxJVFlfU0laRSwgUG9zaXRpb25zLkFCSUxJVFlfQ0hBTk5FTF9CQVJfU0laRSwgY2hhbm5lbFJhdGlvLFxyXG5cdFx0XHRcdHRoaXMudWlDb2xvci5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpLCB0aGlzLnVpQ29sb3IuZ2V0KCksIHRoaXMudWlDb2xvci5nZXQoKSkpXHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFiaWxpdHk7XHJcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcclxuY29uc3Qge2Jvb2xlYW5BcnJheX0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5cclxuY2xhc3MgRGFzaCBleHRlbmRzIEFiaWxpdHkge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoMTIwLCAzLCAxNSwgLjEsIGZhbHNlLCAwKTtcclxuXHR9XHJcblxyXG5cdGFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgaGVybykge1xyXG5cdFx0aWYgKCFib29sZWFuQXJyYXkoaGVyby5jdXJyZW50TW92ZSkpXHJcblx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdGhlcm8uc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCAuLi5oZXJvLmN1cnJlbnRNb3ZlLCAuMSwgdHJ1ZSk7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRGFzaDtcclxuIiwiY29uc3QgUGFzc2l2ZUFiaWxpdHkgPSByZXF1aXJlKCcuL1Bhc3NpdmVBYmlsaXR5Jyk7XHJcbmNvbnN0IFBvb2wgPSByZXF1aXJlKCcuLi91dGlsL1Bvb2wnKTtcclxuXHJcbmNsYXNzIERlbGF5ZWRSZWdlbiBleHRlbmRzIFBhc3NpdmVBYmlsaXR5IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0XHR0aGlzLmRlbGF5ID0gbmV3IFBvb2woNjAsIC0xKTtcclxuXHR9XHJcblxyXG5cdGFjdGl2YXRlKG9yaWdpbiwgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgaGVybykge1xyXG5cdFx0aWYgKGhlcm8ucmVjZW50RGFtYWdlLmdldCgpKVxyXG5cdFx0XHR0aGlzLmRlbGF5LnJlc3RvcmUoKTtcclxuXHRcdGlmICghdGhpcy5kZWxheS5pbmNyZW1lbnQoKSB8fCBoZXJvLmhlYWx0aC5pc0Z1bGwoKSlcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0aGVyby5jaGFuZ2VIZWFsdGgoLjAwMDMpO1xyXG5cdFx0cmV0dXJuIHRydWU7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERlbGF5ZWRSZWdlbjtcclxuIiwiY29uc3QgQWJpbGl0eSA9IHJlcXVpcmUoJy4vQWJpbGl0eScpO1xyXG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvQnVmZicpO1xyXG5cclxuY2xhc3MgSW5jRGVmZW5zZSBleHRlbmRzIEFiaWxpdHkge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0c3VwZXIoNjAwLCAxLCAwLCBmYWxzZSwgZmFsc2UsIDApO1xyXG5cdH1cclxuXHJcblx0YWN0aXZhdGUob3JpZ2luLCBkaXJlY3QsIG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBoZXJvKSB7XHJcblx0XHR0aGlzLmJ1ZmYgPSBuZXcgQnVmZigyMDAsIHRoaXMudWlDb2xvciwgJ0FybW9yJyk7XHJcblx0XHR0aGlzLmJ1ZmYuYXJtb3IgPSAzO1xyXG5cdFx0aGVyby5hZGRCdWZmKHRoaXMuYnVmZik7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW5jRGVmZW5zZTtcclxuIiwiY29uc3QgQWJpbGl0eSA9IHJlcXVpcmUoJy4vQWJpbGl0eScpO1xyXG5cclxuY2xhc3MgUGFzc2l2ZUFiaWxpdHkgZXh0ZW5kcyBBYmlsaXR5IHtcclxuXHRjb25zdHJ1Y3RvcihkaXNhYmxlZE9rID0gZmFsc2UpIHtcclxuXHRcdHN1cGVyKDAsIDEsIDAsIDAsIHRydWUsIDApO1xyXG5cdFx0dGhpcy5kaXNhYmxlZE9rID0gZGlzYWJsZWRPaztcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGFzc2l2ZUFiaWxpdHk7XHJcbiIsImNvbnN0IEFiaWxpdHkgPSByZXF1aXJlKCcuL0FiaWxpdHknKTtcclxuY29uc3Qge3NldE1hZ25pdHVkZSwgcmFuZFZlY3Rvcn0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYXR0YWNrL1Byb2plY3RpbGUnKTtcclxuY29uc3QgQnVmZiA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL0J1ZmYnKTtcclxuXHJcbmNsYXNzIFByb2plY3RpbGVBdHRhY2sgZXh0ZW5kcyBBYmlsaXR5IHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKDYsIDE1LCAuNiwgMCwgdHJ1ZSwgMCk7XHJcblx0fVxyXG5cclxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pIHtcclxuXHRcdGNvbnN0IFZFTE9DSVRZID0gUHJvamVjdGlsZUF0dGFjay52ZWxvY2l0eSwgU1BSRUFEID0gLjA4LCBTSVpFID0gLjAyLCBEQU1BR0UgPSAuMTtcclxuXHRcdGxldCBkaXJlY3R2ID0gc2V0TWFnbml0dWRlKGRpcmVjdC54LCBkaXJlY3QueSwgVkVMT0NJVFkpO1xyXG5cdFx0bGV0IHJhbmR2ID0gcmFuZFZlY3RvcihWRUxPQ0lUWSAqIFNQUkVBRCk7XHJcblx0XHRsZXQgcHJvamVjdGlsZSA9IG5ldyBQcm9qZWN0aWxlKFxyXG5cdFx0XHRvcmlnaW4ueCwgb3JpZ2luLnksXHJcblx0XHRcdFNJWkUsIFNJWkUsXHJcblx0XHRcdGRpcmVjdHYueCArIHJhbmR2WzBdLCBkaXJlY3R2LnkgKyByYW5kdlsxXSxcclxuXHRcdFx0UHJvamVjdGlsZUF0dGFjay5nZXRUaW1lKGhlcm8pLCBEQU1BR0UsXHJcblx0XHRcdGhlcm8uZnJpZW5kbHkpO1xyXG5cdFx0bWFwLmFkZFByb2plY3RpbGUocHJvamVjdGlsZSk7XHJcblx0XHRyZXR1cm4gdHJ1ZTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBnZXRUaW1lKGhlcm8pIHtcclxuXHRcdHJldHVybiA2MCAqIEJ1ZmYuYXR0YWNrUmFuZ2UoaGVyby5idWZmcyk7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgZ2V0IHZlbG9jaXR5KCkge1xyXG5cdFx0cmV0dXJuIC4wMTQ7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFByb2plY3RpbGVBdHRhY2s7XHJcbiIsImNvbnN0IFBhc3NpdmVBYmlsaXR5ID0gcmVxdWlyZSgnLi9QYXNzaXZlQWJpbGl0eScpO1xyXG5jb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgQnVmZiA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL0J1ZmYnKTtcclxuXHJcbmNsYXNzIFJlc3Bhd24gZXh0ZW5kcyBQYXNzaXZlQWJpbGl0eSB7XHJcblx0Y29uc3RydWN0b3IoZGVsYXksIHgsIHkpIHtcclxuXHRcdHN1cGVyKHRydWUpO1xyXG5cdFx0dGhpcy5kZWxheSA9IG5ldyBQb29sKGRlbGF5LCAtMSk7XHJcblx0XHR0aGlzLnggPSB4O1xyXG5cdFx0dGhpcy55ID0geTtcclxuXHRcdHRoaXMuZGVhZEJ1ZmYgPSBuZXcgQnVmZihkZWxheSwgQ29sb3JzLlBMQVlFUl9CVUZGUy5ERUFELCAnRGVhZCcpO1xyXG5cdFx0dGhpcy5kZWFkQnVmZi5kaXNhYmxlZCA9IDE7XHJcblx0fVxyXG5cclxuXHRhY3RpdmF0ZShvcmlnaW4sIGRpcmVjdCwgbWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGhlcm8pIHtcclxuXHRcdGlmIChoZXJvLmhlYWx0aC5pc0VtcHR5KCkgJiYgdGhpcy5kZWxheS5pc0Z1bGwoKSkge1xyXG5cdFx0XHR0aGlzLmRlYWRCdWZmLnJlc2V0KCk7XHJcblx0XHRcdGhlcm8uYWRkQnVmZih0aGlzLmRlYWRCdWZmKTtcclxuXHRcdFx0dGhpcy5kZWFkID0gdHJ1ZTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMuZGVhZCB8fCAhdGhpcy5kZWxheS5pbmNyZW1lbnQoKSlcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdHRoaXMuZGVsYXkucmVzdG9yZSgpO1xyXG5cdFx0aGVyby5yZXN0b3JlSGVhbHRoKCk7XHJcblx0XHRoZXJvLnNldFBvc2l0aW9uKHRoaXMueCwgdGhpcy55KTtcclxuXHRcdHRoaXMuZGVhZEJ1ZmYuZXhwaXJlKCk7XHJcblx0XHR0aGlzLmRlYWQgPSBmYWxzZTtcclxuXHRcdHJldHVybiB0cnVlO1xyXG5cclxuXHRcdC8vIHRvZG8gW21lZGl1bV0gYXJtb3IgYnVmZiBvbiByZXNwYXduXHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3Bhd247XHJcbiIsImNvbnN0IHtjbGFtcCwgYXZnfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNsYXNzIENhbWVyYSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHogPSAyKSB7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMuZW5kWiA9IHRoaXMueiA9IHo7XG5cdFx0dGhpcy5zMCA9IHRoaXMuY2FsY1MoMCk7XG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlRm9yUmVnaW9uKGZyb21TY2FsZSwgdG9MZWZ0LCB0b1RvcCwgdG9TY2FsZSkge1xuXHRcdGxldCBpbnZTY2FsZSA9IGZyb21TY2FsZSAvIHRvU2NhbGU7XG5cdFx0cmV0dXJuIG5ldyBDYW1lcmEoKC41IC0gdG9MZWZ0KSAqIGludlNjYWxlLCAoLjUgLSB0b1RvcCkgKiBpbnZTY2FsZSwgaW52U2NhbGUpO1xuXHR9XG5cblx0Ly8gY2VudGVyIHJhbmdlIFtbMCwgd2lkdGhdLCBbMCwgaGVpZ2h0XV1cblx0Ly8gYWRqdXN0bWVudCByYW5nZSBbWzAsIDFdLCBbMCwgMV1dXG5cdG1vdmUoY2VudGVyLCBhZGp1c3RtZW50KSB7XG5cdFx0Y29uc3QgQURKVVNUTUVOVF9XRUlHSFQgPSAuNSwgRklMVEVSX1dFSUdIVCA9IC45Mztcblx0XHRsZXQgeCA9IGNlbnRlci54ICsgKGFkanVzdG1lbnQueCAtIC41KSAqIEFESlVTVE1FTlRfV0VJR0hUO1xuXHRcdGxldCB5ID0gY2VudGVyLnkgKyAoYWRqdXN0bWVudC55IC0gLjUpICogQURKVVNUTUVOVF9XRUlHSFQ7XG5cdFx0dGhpcy54ID0gYXZnKHRoaXMueCwgeCwgRklMVEVSX1dFSUdIVCk7XG5cdFx0dGhpcy55ID0gYXZnKHRoaXMueSwgeSwgRklMVEVSX1dFSUdIVCk7XG5cdH1cblxuXHR6b29tKHpvb21PdXQsIHpvb21Jbikge1xuXHRcdGNvbnN0IFpPT01fUkFURSA9IC4yLCBNSU5fWiA9IDEsIE1BWF9aID0gMTAsIEZJTFRFUl9XRUlHSFQgPSAuOTM7XG5cdFx0bGV0IGR6ID0gem9vbU91dCAtIHpvb21Jbjtcblx0XHRpZiAoZHopXG5cdFx0XHR0aGlzLmVuZFogPSBjbGFtcCh0aGlzLmVuZFogKyBkeiAqIFpPT01fUkFURSwgTUlOX1osIE1BWF9aKTtcblx0XHR0aGlzLnogPSBhdmcodGhpcy56LCB0aGlzLmVuZFosIEZJTFRFUl9XRUlHSFQpO1xuXHRcdHRoaXMuczAgPSB0aGlzLmNhbGNTKDApO1xuXHR9XG5cblx0Y2FsY1MoZHopIHtcblx0XHRyZXR1cm4gMSAvICh0aGlzLnogKyBkeik7XG5cdH1cblxuXHRnZXRTKGR6KSB7XG5cdFx0cmV0dXJuIGR6ID8gdGhpcy5jYWxjUyhkeikgOiB0aGlzLnMwO1xuXHR9XG5cblx0eHQoeCwgZHogPSAwKSB7XG5cdFx0cmV0dXJuICh4IC0gdGhpcy54KSAqIHRoaXMuZ2V0UyhkeikgKyAuNTtcblx0fVxuXG5cdHl0KHksIGR6ID0gMCkge1xuXHRcdHJldHVybiAoeSAtIHRoaXMueSkgKiB0aGlzLmdldFMoZHopICsgLjU7XG5cdH1cblxuXHRzdChzaXplLCBkeiA9IDApIHtcblx0XHRyZXR1cm4gc2l6ZSAqIHRoaXMuZ2V0Uyhkeik7XG5cdH1cblxuXHR4aXQoeCkge1xuXHRcdHJldHVybiB0aGlzLnggKyAoeCAtIC41KSAqIHRoaXMuejtcblx0fVxuXG5cdHlpdCh5KSB7XG5cdFx0cmV0dXJuIHRoaXMueSArICh5IC0gLjUpICogdGhpcy56O1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiY29uc3QgU3RhdGUgPSByZXF1aXJlKCcuL1N0YXRlJyk7XG5cbmNsYXNzIENvbnRyb2xsZXIge1xuXHRjb25zdHJ1Y3Rvcihtb3VzZVRhcmdldCkge1xuXHRcdHRoaXMubW91c2VUYXJnZXRXaWR0aCA9IG1vdXNlVGFyZ2V0LndpZHRoO1xuXHRcdHRoaXMubW91c2VUYXJnZXRIZWlnaHQgPSBtb3VzZVRhcmdldC5oZWlnaHQ7XG5cblx0XHR0aGlzLmtleXMgPSB7fTtcblx0XHR0aGlzLm1vdXNlID0ge3g6IG51bGwsIHk6IG51bGx9O1xuXHRcdHRoaXMudHJhbnNmb3JtZWRNb3VzZSA9IHt9O1xuXHRcdHRoaXMubW91c2VTdGF0ZSA9IG5ldyBTdGF0ZSgpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGV2ZW50ID0+XG5cdFx0XHQhZXZlbnQucmVwZWF0ICYmIHRoaXMuaGFuZGxlS2V5UHJlc3MoZXZlbnQua2V5LnRvTG93ZXJDYXNlKCkpKTtcblxuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgZXZlbnQgPT5cblx0XHRcdHRoaXMuaGFuZGxlS2V5UmVsZWFzZShldmVudC5rZXkudG9Mb3dlckNhc2UoKSkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZXZlbnQgPT5cblx0XHRcdHRoaXMuaGFuZGxlTW91c2VNb3ZlKGV2ZW50LnggLSBtb3VzZVRhcmdldC5vZmZzZXRMZWZ0LCBldmVudC55IC0gbW91c2VUYXJnZXQub2Zmc2V0VG9wKSk7XG5cblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCAoKSA9PlxuXHRcdFx0dGhpcy5oYW5kbGVNb3VzZVByZXNzKCkpO1xuXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsICgpID0+XG5cdFx0XHR0aGlzLmhhbmRsZU1vdXNlUmVsZWFzZSgpKTtcblxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdibHVyJywgKCkgPT5cblx0XHRcdHRoaXMuaGFuZGxlQmx1cigpKTtcblx0fVxuXG5cdGhhbmRsZUtleVByZXNzKGtleSkge1xuXHRcdGlmICghdGhpcy5rZXlzW2tleV0pXG5cdFx0XHR0aGlzLmtleXNba2V5XSA9IG5ldyBTdGF0ZSgpO1xuXHRcdHRoaXMua2V5c1trZXldLnByZXNzKCk7XG5cdH1cblxuXHRoYW5kbGVLZXlSZWxlYXNlKGtleSkge1xuXHRcdGlmICghdGhpcy5rZXlzW2tleV0pXG5cdFx0XHR0aGlzLmtleXNba2V5XSA9IG5ldyBTdGF0ZSgpO1xuXHRcdHRoaXMua2V5c1trZXldLnJlbGVhc2UoKTtcblx0fVxuXG5cdGhhbmRsZU1vdXNlTW92ZSh4LCB5KSB7XG5cdFx0dGhpcy5tb3VzZS54ID0geCAvIHRoaXMubW91c2VUYXJnZXRXaWR0aDtcblx0XHR0aGlzLm1vdXNlLnkgPSB5IC8gdGhpcy5tb3VzZVRhcmdldEhlaWdodDtcblx0fVxuXG5cdGhhbmRsZU1vdXNlUHJlc3MoKSB7XG5cdFx0dGhpcy5tb3VzZVN0YXRlLnByZXNzKCk7XG5cdH1cblxuXHRoYW5kbGVNb3VzZVJlbGVhc2UoKSB7XG5cdFx0dGhpcy5tb3VzZVN0YXRlLnJlbGVhc2UoKTtcblx0fVxuXG5cdGhhbmRsZUJsdXIoKSB7XG5cdFx0T2JqZWN0LnZhbHVlcyh0aGlzLmtleXMpXG5cdFx0XHQuZmlsdGVyKChzdGF0ZSkgPT4gc3RhdGUuYWN0aXZlKVxuXHRcdFx0LmZvckVhY2goKHN0YXRlKSA9PiBzdGF0ZS5yZWxlYXNlKCkpO1xuXHR9XG5cblx0Ly8gbWFwIGtleSAoZS5nLiAneicpIHRvIHN0YXRlXG5cdGdldEtleVN0YXRlKGtleSkge1xuXHRcdHJldHVybiB0aGlzLmtleXNba2V5XSB8fCAodGhpcy5rZXlzW2tleV0gPSBuZXcgU3RhdGUoKSk7XG5cdH1cblxuXHRnZXRSYXdNb3VzZShkZWZhdWx0WCA9IDAsIGRlZmF1bHRZID0gMCkge1xuXHRcdHJldHVybiB0aGlzLm1vdXNlLnggPyB0aGlzLm1vdXNlIDoge3g6IGRlZmF1bHRYLCB5OiBkZWZhdWx0WX07XG5cdH1cblxuXHRpbnZlcnNlVHJhbnNmb3JtTW91c2UoaW52ZXJzZVRyYW5zZm9ybWVyKSB7XG5cdFx0dGhpcy50cmFuc2Zvcm1lZE1vdXNlLnggPSBpbnZlcnNlVHJhbnNmb3JtZXIueGl0KHRoaXMubW91c2UueCk7XG5cdFx0dGhpcy50cmFuc2Zvcm1lZE1vdXNlLnkgPSBpbnZlcnNlVHJhbnNmb3JtZXIueWl0KHRoaXMubW91c2UueSk7XG5cdH1cblxuXHRnZXRNb3VzZSgpIHtcblx0XHRyZXR1cm4gdGhpcy50cmFuc2Zvcm1lZE1vdXNlO1xuXHR9XG5cblx0Z2V0TW91c2VTdGF0ZSgpIHtcblx0XHRyZXR1cm4gdGhpcy5tb3VzZVN0YXRlO1xuXHR9XG5cblx0ZXhwaXJlKCkge1xuXHRcdE9iamVjdC52YWx1ZXModGhpcy5rZXlzKS5mb3JFYWNoKChzdGF0ZSkgPT4gc3RhdGUuZXhwaXJlKCkpO1xuXHRcdHRoaXMubW91c2VTdGF0ZS5leHBpcmUoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnRyb2xsZXI7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xuY29uc3QgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4vQ29udHJvbGxlcicpO1xuY29uc3QgU3RhdGUgPSByZXF1aXJlKCcuL1N0YXRlJyk7XG5cbmNvbnN0IENvbnRyb2xzID0gbWFrZUVudW0oXG5cdCdNT1ZFX0xFRlQnLFxuXHQnTU9WRV9VUCcsXG5cdCdNT1ZFX1JJR0hUJyxcblx0J01PVkVfRE9XTicsXG5cdCdBQklMSVRZXzEnLFxuXHQnQUJJTElUWV8yJyxcblx0J0FCSUxJVFlfMycsXG5cdCdBQklMSVRZXzQnLFxuXHQnQUJJTElUWV81Jyxcblx0J0FCSUxJVFlfNicsXG5cdCdBQklMSVRZXzcnLFxuXHQnVEFSR0VUX0xPQ0snLFxuXHQnWk9PTV9JTicsXG5cdCdaT09NX09VVCcsXG5cdCdNSU5JTUFQX1pPT00nKTtcblxuQ29udHJvbHMuQUJJTElUWV9JID0gW1xuXHRDb250cm9scy5BQklMSVRZXzEsXG5cdENvbnRyb2xzLkFCSUxJVFlfMixcblx0Q29udHJvbHMuQUJJTElUWV8zLFxuXHRDb250cm9scy5BQklMSVRZXzQsXG5cdENvbnRyb2xzLkFCSUxJVFlfNSxcblx0Q29udHJvbHMuQUJJTElUWV82LFxuXHRDb250cm9scy5BQklMSVRZXzddO1xuXG5sZXQgQ29udHJvbFRvS2V5TWFwID0ge1xuXHRbQ29udHJvbHMuTU9WRV9MRUZUXTogWydhJ10sXG5cdFtDb250cm9scy5NT1ZFX1VQXTogWyd3J10sXG5cdFtDb250cm9scy5NT1ZFX1JJR0hUXTogWydkJ10sXG5cdFtDb250cm9scy5NT1ZFX0RPV05dOiBbJ3MnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfMV06IFsnaicsICcxJ10sXG5cdFtDb250cm9scy5BQklMSVRZXzJdOiBbJ2snLCAnMiddLFxuXHRbQ29udHJvbHMuQUJJTElUWV8zXTogWydsJywgJzMnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfNF06IFsndScsICc0J10sXG5cdFtDb250cm9scy5BQklMSVRZXzVdOiBbJ2knLCAnNSddLFxuXHRbQ29udHJvbHMuQUJJTElUWV82XTogWydvJywgJzYnXSxcblx0W0NvbnRyb2xzLkFCSUxJVFlfN106IFsncCcsICc3J10sXG5cdFtDb250cm9scy5UQVJHRVRfTE9DS106IFsnY2Fwc2xvY2snXSxcblx0W0NvbnRyb2xzLlpPT01fSU5dOiBbJ3gnXSxcblx0W0NvbnRyb2xzLlpPT01fT1VUXTogWyd6J10sXG5cdFtDb250cm9scy5NSU5JTUFQX1pPT01dOiBbJ3EnXSxcbn07XG5cbmNsYXNzIEtleW1hcHBpbmcge1xuXHQvLyBtYXAgY29udHJvbCAoZS5nLiBaT09NX09VVCkgdG8ga2V5cyAoZS5nLiBbJ3onLCAneSddKVxuXHRzdGF0aWMgZ2V0S2V5cyhjb250cm9sKSB7XG5cdFx0cmV0dXJuIEtleW1hcHBpbmcuQ29udHJvbFRvS2V5TWFwW2NvbnRyb2xdO1xuXHR9XG5cblx0Ly8gbWFwIGNvbnRyb2wgKGUuZy4gWk9PTV9PVVQpIHRvIHN0YXRlXG5cdHN0YXRpYyBnZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgY29udHJvbCkge1xuXHRcdHJldHVybiBTdGF0ZS5tZXJnZShLZXltYXBwaW5nLmdldEtleXMoY29udHJvbCkubWFwKGtleSA9PiBjb250cm9sbGVyLmdldEtleVN0YXRlKGtleSkpKTtcblx0fVxufVxuXG5LZXltYXBwaW5nLkNvbnRyb2xzID0gQ29udHJvbHM7XG5LZXltYXBwaW5nLkNvbnRyb2xUb0tleU1hcCA9IENvbnRyb2xUb0tleU1hcDtcblxubW9kdWxlLmV4cG9ydHMgPSBLZXltYXBwaW5nO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcblxuLy8gbGFyZ2VyIHZhbHVlcyBoYXZlIHByaW9yaXR5IHdoZW4gbXVsdGlwbGUga2V5cyBhcmUgbWFwcGVkIHRvIHRoZSBzYW1lIGNvbnRyb2xcbmNvbnN0IFN0YXRlcyA9IG1ha2VFbnVtKCdVUCcsICdSRUxFQVNFRCcsICdQUkVTU0VEJywgJ0RPV04nKTtcblxuY2xhc3MgU3RhdGUge1xuXHRjb25zdHJ1Y3RvcihzdGF0ZSA9IFN0YXRlcy5VUCkge1xuXHRcdHRoaXMuc3RhdGUgPSBzdGF0ZTtcblx0fVxuXG5cdHN0YXRpYyBtZXJnZShzdGF0ZXMpIHtcblx0XHRyZXR1cm4gbmV3IFN0YXRlKE1hdGgubWF4KC4uLnN0YXRlcy5tYXAoc3RhdGUgPT4gc3RhdGUuc3RhdGUpKSk7XG5cdH1cblxuXHRwcmVzcygpIHtcblx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLlBSRVNTRUQ7XG5cdH1cblxuXHRyZWxlYXNlKCkge1xuXHRcdHRoaXMuc3RhdGUgPSBTdGF0ZXMuUkVMRUFTRUQ7XG5cdH1cblxuXHRleHBpcmUoKSB7XG5cdFx0aWYgKHRoaXMuc3RhdGUgPT09IFN0YXRlcy5SRUxFQVNFRClcblx0XHRcdHRoaXMuc3RhdGUgPSBTdGF0ZXMuVVA7XG5cdFx0ZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gU3RhdGVzLlBSRVNTRUQpXG5cdFx0XHR0aGlzLnN0YXRlID0gU3RhdGVzLkRPV047XG5cdH1cblxuXHRnZXQgYWN0aXZlKCkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRlID09PSBTdGF0ZXMuUFJFU1NFRCB8fCB0aGlzLnN0YXRlID09PSBTdGF0ZXMuRE9XTjtcblx0fVxuXG5cdGdldCBwcmVzc2VkKCkge1xuXHRcdHJldHVybiB0aGlzLnN0YXRlID09PSBTdGF0ZXMuUFJFU1NFRDtcblx0fVxufVxuXG5TdGF0ZS5TdGF0ZXMgPSBTdGF0ZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGU7XG4iLCJjb25zdCBQb29sID0gcmVxdWlyZSgnLi4vdXRpbC9Qb29sJyk7XHJcbmNvbnN0IHtQb3NpdGlvbnN9ID0gcmVxdWlyZSgnLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xyXG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XHJcblxyXG5jbGFzcyBCdWZmIHtcclxuXHRjb25zdHJ1Y3RvcihkdXJhdGlvbiwgdWlDb2xvciwgdWlUZXh0KSB7XHJcblx0XHQvLyBkdXJhdGlvbiBwYXJhbSBvZiAwIHdpbGwgYmUgaW5maW5pdGUsIDEgd2lsbCBiZSBhY3RpdmUgZm9yIDEgdGlja1xyXG5cdFx0dGhpcy5kdXJhdGlvblVubGltaXRlZCA9ICFkdXJhdGlvbjtcclxuXHRcdHRoaXMuZHVyYXRpb24gPSBuZXcgUG9vbChkdXJhdGlvbiArIDEsIC0xKTtcclxuXHRcdHRoaXMudWlDb2xvciA9IHVpQ29sb3I7XHJcblx0XHR0aGlzLnVpVGV4dCA9IHVpVGV4dDtcclxuXHR9XHJcblxyXG5cdHNldFVpSW5kZXgodWlJbmRleCkge1xyXG5cdFx0dGhpcy51aUluZGV4ID0gdWlJbmRleDtcclxuXHR9XHJcblxyXG5cdC8vIHJldHVybnMgMSBpZiB1bm1vZGlmaWVkXHJcblx0c3RhdGljIGdldF8oYnVmZnMsIGtleSkge1xyXG5cdFx0cmV0dXJuIGJ1ZmZzLnJlZHVjZSgoYWNjLCB7W2tleV06IHZhbHVlID0gMH0pID0+IGFjYyArIHZhbHVlLCAxKTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBtb3ZlU3BlZWQoYnVmZnMpIHtcclxuXHRcdHJldHVybiBCdWZmLmdldF8oYnVmZnMsICdtb3ZlU3BlZWRfJyk7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgYXR0YWNrUmFuZ2UoYnVmZnMpIHtcclxuXHRcdHJldHVybiBCdWZmLmdldF8oYnVmZnMsICdhdHRhY2tSYW5nZV8nKTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBhcm1vcihidWZmcykge1xyXG5cdFx0cmV0dXJuIEJ1ZmYuZ2V0XyhidWZmcywgJ2FybW9yXycpO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGRpc2FibGVkKGJ1ZmZzKSB7XHJcblx0XHRyZXR1cm4gQnVmZi5nZXRfKGJ1ZmZzLCAnZGlzYWJsZWRfJykgPiAxO1xyXG5cdH1cclxuXHJcblx0c2V0IG1vdmVTcGVlZCh2YWx1ZSkge1xyXG5cdFx0dGhpcy5tb3ZlU3BlZWRfID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHRzZXQgYXR0YWNrUmFuZ2UodmFsdWUpIHtcclxuXHRcdHRoaXMuYXR0YWNrUmFuZ2VfID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHRzZXQgYXJtb3IodmFsdWUpIHtcclxuXHRcdHRoaXMuYXJtb3JfID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHRzZXQgZGlzYWJsZWQodmFsdWUpIHtcclxuXHRcdHRoaXMuZGlzYWJsZWRfID0gdmFsdWU7XHJcblx0fVxyXG5cclxuXHQvLyByZXR1cm4gdHJ1ZSBpZiBleHBpcmVkLiBMZWF2aW5nIGR1cmF0aW9uIHVuZGVmaW5lZCBvciAwIHdpbGwgbmV2ZXIgZXhwaXJlLlxyXG5cdHRpY2soKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5leHBpcmVkIHx8ICF0aGlzLmR1cmF0aW9uVW5saW1pdGVkICYmIHRoaXMuZHVyYXRpb24uaW5jcmVtZW50KCk7XHJcblx0fVxyXG5cclxuXHRyZXNldCgpIHtcclxuXHRcdHRoaXMuZXhwaXJlZCA9IGZhbHNlO1xyXG5cdFx0dGhpcy5kdXJhdGlvbi5yZXN0b3JlKCk7XHJcblx0fVxyXG5cclxuXHRleHBpcmUoKSB7XHJcblx0XHR0aGlzLmR1cmF0aW9uLnZhbHVlID0gMDtcclxuXHRcdHRoaXMuZXhwaXJlZCA9IHRydWU7XHJcblx0fVxyXG5cclxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xyXG5cdFx0bGV0IGxlZnQgPSAxIC0gKHRoaXMudWlJbmRleCArIDEpICogKFBvc2l0aW9ucy5CVUZGX1NJWkUgKyBQb3NpdGlvbnMuTUFSR0lOKTtcclxuXHRcdGxldCB0b3AgPSAxIC0gUG9zaXRpb25zLk1BUkdJTiAqIDMgLSBQb3NpdGlvbnMuQkFSX0hFSUdIVCAqIDIgLSBQb3NpdGlvbnMuQlVGRl9TSVpFO1xyXG5cdFx0bGV0IHNpemUgPSBQb3NpdGlvbnMuQlVGRl9TSVpFO1xyXG5cclxuXHRcdC8vIGJhY2tncm91bmRcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KGxlZnQsIHRvcCwgc2l6ZSwgc2l6ZSwge2ZpbGw6IHRydWUsIGNvbG9yOiB0aGlzLnVpQ29sb3IuZ2V0U2hhZGUoKX0pKTtcclxuXHJcblx0XHQvLyBmb3JlZ3JvdW5kIGZvciBjdXJyZW50IGNoYXJnZXNcclxuXHRcdGxldCBmaWxsSGVpZ2h0ID0gc2l6ZSAqIHRoaXMuZHVyYXRpb24uZ2V0UmF0aW8oKTtcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KGxlZnQsIHRvcCArIHNpemUgLSBmaWxsSGVpZ2h0LCBzaXplLCBmaWxsSGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IHRoaXMudWlDb2xvci5nZXQoKX0pKTtcclxuXHJcblx0XHQvLyB0ZXh0XHJcblx0XHRwYWludGVyLmFkZChuZXcgVGV4dChsZWZ0ICsgc2l6ZSAvIDIsIHRvcCArIHNpemUgLyAyLCB0aGlzLnVpVGV4dCkpO1xyXG5cdH1cclxuXHJcblx0cGFpbnRBdChwYWludGVyLCBjYW1lcmEsIGxlZnQsIHRvcCwgc2l6ZSkge1xyXG5cdFx0Ly8gYmFja2dyb3VuZFxyXG5cdFx0cGFpbnRlci5hZGQoUmVjdC53aXRoQ2FtZXJhKGNhbWVyYSwgbGVmdCwgdG9wLCBzaXplLCBzaXplLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IHRoaXMudWlDb2xvci5nZXRTaGFkZSgpfSkpO1xyXG5cclxuXHRcdC8vIGZvcmVncm91bmQgZm9yIGN1cnJlbnQgY2hhcmdlc1xyXG5cdFx0bGV0IGZpbGxIZWlnaHQgPSBzaXplICogdGhpcy5kdXJhdGlvbi5nZXRSYXRpbygpO1xyXG5cdFx0cGFpbnRlci5hZGQoUmVjdC53aXRoQ2FtZXJhKGNhbWVyYSwgbGVmdCwgdG9wICsgc2l6ZSAtIGZpbGxIZWlnaHQsIHNpemUsIGZpbGxIZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogdGhpcy51aUNvbG9yLmdldCgpfSkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCdWZmO1xyXG4iLCJjb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vQm91bmRzJyk7XG5jb25zdCB7c2V0TWFnbml0dWRlfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNsYXNzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKSB7XG5cdFx0dGhpcy5ib3VuZHMgPSBuZXcgQm91bmRzKCk7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblx0XHR0aGlzLnNldFBvc2l0aW9uKHgsIHkpO1xuXHRcdHRoaXMubW92ZURpcmVjdGlvbiA9IHt4OiAwLCB5OiAxfTtcblx0XHR0aGlzLnF1ZXVlZFRyYWNrZWRJbnRlcnNlY3Rpb25zID0gW107XG5cdH1cblxuXHRzZXRHcmFwaGljcyhncmFwaGljcykge1xuXHRcdHRoaXMuZ3JhcGhpY3MgPSBncmFwaGljcztcblx0fVxuXG5cdHNldFBvc2l0aW9uKHgsIHkpIHtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy5zZXRCb3VuZHMoKTtcblx0fVxuXG5cdGNoZWNrUG9zaXRpb24oaW50ZXJzZWN0aW9uRmluZGVyKSB7XG5cdFx0cmV0dXJuIHRoaXMueCAhPT0gdW5kZWZpbmVkICYmXG5cdFx0XHQhaW50ZXJzZWN0aW9uRmluZGVyLmludGVyc2VjdGlvbnModGhpcy5sYXllciwgdGhpcy5ib3VuZHMpLmxlbmd0aFxuXHR9XG5cblx0Y2hlY2tNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcblx0XHRyZXR1cm4gaW50ZXJzZWN0aW9uRmluZGVyLmNhbk1vdmUodGhpcy5sYXllciwgdGhpcy5ib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKTtcblx0fVxuXG5cdHNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcblx0XHRsZXQgaW50ZXJzZWN0aW9uTW92ZSA9IGludGVyc2VjdGlvbkZpbmRlci5jYW5Nb3ZlKHRoaXMubGF5ZXIsIHRoaXMuYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgbm9TbGlkZSk7XG5cdFx0dGhpcy5tb3ZlKGludGVyc2VjdGlvbk1vdmUueCwgaW50ZXJzZWN0aW9uTW92ZS55KTtcblx0XHRpbnRlcnNlY3Rpb25Nb3ZlLnRyYWNrZWRPbmx5UmVmZXJlbmNlcy5mb3JFYWNoKHJlZmVyZW5jZSA9PiByZWZlcmVuY2UucXVldWVUcmFja2VkSW50ZXJzZWN0aW9uKHRoaXMpKTtcblx0XHRyZXR1cm4gaW50ZXJzZWN0aW9uTW92ZTtcblx0fVxuXG5cdG1vdmUoZHgsIGR5KSB7XG5cdFx0dGhpcy54ICs9IGR4O1xuXHRcdHRoaXMueSArPSBkeTtcblx0XHR0aGlzLnNldE1vdmVEaXJlY3Rpb24oZHgsIGR5KTtcblx0XHR0aGlzLnNldEJvdW5kcygpO1xuXHR9XG5cblx0c2V0TW92ZURpcmVjdGlvbihkeCwgZHkpIHtcblx0XHRpZiAoZHggfHwgZHkpXG5cdFx0XHR0aGlzLm1vdmVEaXJlY3Rpb24gPSBzZXRNYWduaXR1ZGUoZHgsIGR5KTtcblx0fVxuXG5cdGFkZEludGVyc2VjdGlvbkJvdW5kcyhpbnRlcnNlY3Rpb25GaW5kZXIpIHtcblx0XHR0aGlzLmludGVyc2VjdGlvbkhhbmRsZSA9IGludGVyc2VjdGlvbkZpbmRlci5hZGRCb3VuZHModGhpcy5sYXllciwgdGhpcy5ib3VuZHMsIHRoaXMpO1xuXHR9XG5cblx0cmVtb3ZlSW50ZXJzZWN0aW9uQm91bmRzKGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdGludGVyc2VjdGlvbkZpbmRlci5yZW1vdmVCb3VuZHModGhpcy5sYXllciwgdGhpcy5pbnRlcnNlY3Rpb25IYW5kbGUpO1xuXHR9XG5cblx0c2V0Qm91bmRzKCkge1xuXHRcdGxldCBoYWxmV2lkdGggPSB0aGlzLndpZHRoIC8gMjtcblx0XHRsZXQgaGFsZkhlaWdodCA9IHRoaXMuaGVpZ2h0IC8gMjtcblx0XHR0aGlzLmJvdW5kcy5zZXQodGhpcy54IC0gaGFsZldpZHRoLCB0aGlzLnkgLSBoYWxmSGVpZ2h0LCB0aGlzLnggKyBoYWxmV2lkdGgsIHRoaXMueSArIGhhbGZIZWlnaHQpO1xuXHR9XG5cblx0cXVldWVUcmFja2VkSW50ZXJzZWN0aW9uKHJlZmVyZW5jZSkge1xuXHRcdHRoaXMucXVldWVkVHJhY2tlZEludGVyc2VjdGlvbnMucHVzaChyZWZlcmVuY2UpO1xuXHR9XG5cblx0Y2hhbmdlSGVhbHRoKGFtb3VudCkge1xuXHR9XG5cblx0cmVtb3ZlVWkoKSB7XG5cdFx0Lyogb3ZlcnJpZGUsIHJldHVybiB0cnVlIGlmIHVpIGlzIG5vdCBsb25nZXIgcmVsZXZhbnQgYW5kIHNob3VsZCBiZSByZW1vdmVkIGZyb20gdGhlIHVpIHF1ZXVlICovXG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHR0aGlzLmdyYXBoaWNzLnBhaW50KHBhaW50ZXIsIGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMubW92ZURpcmVjdGlvbik7XG5cdH1cblxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi9FbnRpdHknKTtcclxuY29uc3QgUG9vbCA9IHJlcXVpcmUoJy4uL3V0aWwvUG9vbCcpO1xyXG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi9CdWZmJyk7XHJcblxyXG5jbGFzcyBMaXZpbmdFbnRpdHkgZXh0ZW5kcyBFbnRpdHkge1xyXG5cdGNvbnN0cnVjdG9yKHgsIHksIHdpZHRoLCBoZWlnaHQsIGhlYWx0aCwgbGF5ZXIpIHtcclxuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKTtcclxuXHRcdHRoaXMuaGVhbHRoID0gbmV3IFBvb2woaGVhbHRoKTtcclxuXHRcdHRoaXMuYnVmZnMgPSBbXTtcclxuXHR9XHJcblxyXG5cdHJlZnJlc2goKSB7XHJcblx0XHR0aGlzLnRpY2tCdWZmcygpO1xyXG5cdH1cclxuXHJcblx0Y2hhbmdlSGVhbHRoKGFtb3VudCkge1xyXG5cdFx0dGhpcy5oZWFsdGguY2hhbmdlKGFtb3VudCAvIEJ1ZmYuYXJtb3IodGhpcy5idWZmcykpO1xyXG5cdH1cclxuXHJcblx0cmVzdG9yZUhlYWx0aCgpIHtcclxuXHRcdHRoaXMuaGVhbHRoLnJlc3RvcmUoKTtcclxuXHR9XHJcblxyXG5cdGFkZEJ1ZmYoYnVmZikge1xyXG5cdFx0aWYgKHRoaXMuYnVmZnMuaW5kZXhPZihidWZmKSA9PT0gLTEpIHtcclxuXHRcdFx0dGhpcy5idWZmcy5wdXNoKGJ1ZmYpO1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHRpY2tCdWZmcygpIHtcclxuXHRcdHRoaXMuYnVmZnMgPSB0aGlzLmJ1ZmZzLmZpbHRlcihidWZmID0+ICFidWZmLnRpY2soKSk7XHJcblx0fVxyXG5cclxuXHRyZW1vdmVVaSgpIHtcclxuXHRcdHJldHVybiB0aGlzLmhlYWx0aC5pc0VtcHR5KCk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExpdmluZ0VudGl0eTtcclxuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Z2V0UmVjdERpc3RhbmNlfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgQXJlYURlZ2VuIGV4dGVuZHMgRW50aXR5IHtcblx0Ly8gaWYgbWF4VGFyZ2V0cyA8PSAwLCB3aWxsIGJlIHRyZWF0ZWQgYXMgaW5maW5pdGVcblx0Y29uc3RydWN0b3IoeCwgeSwgcmFuZ2UsIHRpbWUsIGRhbWFnZSwgZnJpZW5kbHkpIHtcblx0XHRsZXQgbGF5ZXIgPSBmcmllbmRseSA/IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSA6IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFO1xuXHRcdHN1cGVyKHgsIHksIHJhbmdlLCByYW5nZSwgbGF5ZXIpO1xuXHRcdHRoaXMucmFuZ2UgPSByYW5nZTtcblx0XHR0aGlzLnRpbWUgPSB0aW1lOyAvLyAtMSB3aWxsIGJlIGluZmluaXRlLCAwIHdpbGwgYmUgMSB0aWNrXG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdH1cblxuXHR1cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIpIHtcblx0XHRpbnRlcnNlY3Rpb25GaW5kZXIuaW50ZXJzZWN0aW9ucyh0aGlzLmxheWVyLCB0aGlzLmJvdW5kcylcblx0XHRcdC5mb3JFYWNoKG1vbnN0ZXIgPT4gbW9uc3Rlci5jaGFuZ2VIZWFsdGgoLXRoaXMuZGFtYWdlKSk7XG5cdFx0cmV0dXJuICF0aGlzLnRpbWUtLTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSwgd2FybmluZyA9IGZhbHNlKSB7XG5cdFx0bGV0IGdyYXBoaWNPcHRpb25zID0gd2FybmluZyA/XG5cdFx0XHR7Y29sb3I6IENvbG9ycy5FbnRpdHkuQVJFQV9ERUdFTi5XQVJOSU5HX0JPUkRFUi5nZXQoKX0gOlxuXHRcdFx0e2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5LkFSRUFfREVHRU4uQUNUSVZFX0ZJTEwuZ2V0KCl9O1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLFxuXHRcdFx0dGhpcy54LCB0aGlzLnksXG5cdFx0XHR0aGlzLnJhbmdlLCB0aGlzLnJhbmdlLFxuXHRcdFx0Z3JhcGhpY09wdGlvbnMpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEFyZWFEZWdlbjtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgTGluZSA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvTGluZScpO1xuXG5jbGFzcyBMYXNlciBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIGR4LCBkeSwgd2lkdGgsIHRpbWUsIGRhbWFnZSwgZnJpZW5kbHkpIHtcblx0XHRsZXQgbGF5ZXIgPSBmcmllbmRseSA/IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSA6IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFO1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCB3aWR0aCwgbGF5ZXIpO1xuXHRcdHRoaXMuZHggPSBkeDtcblx0XHR0aGlzLmR5ID0gZHk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0XHR0aGlzLmRhbWFnZSA9IGRhbWFnZTtcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikge1xuXHRcdCh7eDogdGhpcy5tb3ZlWCwgeTogdGhpcy5tb3ZlWSwgcmVmZXJlbmNlOiB0aGlzLmludGVyc2VjdGlvbn0gPVxuXHRcdFx0dGhpcy5jaGVja01vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLmR4LCB0aGlzLmR5LCAtMSwgdHJ1ZSkpO1xuXG5cdFx0aWYgKHRoaXMuaW50ZXJzZWN0aW9uKVxuXHRcdFx0dGhpcy5pbnRlcnNlY3Rpb24uY2hhbmdlSGVhbHRoKC10aGlzLmRhbWFnZSk7XG5cblx0XHRyZXR1cm4gIXRoaXMudGltZS0tO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0cGFpbnRlci5hZGQoTGluZS53aXRoQ2FtZXJhKFxuXHRcdFx0Y2FtZXJhLFxuXHRcdFx0dGhpcy54LCB0aGlzLnksXG5cdFx0XHR0aGlzLnggKyB0aGlzLm1vdmVYLCB0aGlzLnkgKyB0aGlzLm1vdmVZLFxuXHRcdFx0dGhpcy53aWR0aCxcblx0XHRcdHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5IT1NUSUxFX1BST0pFQ1RJTEUuZ2V0KCl9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMYXNlcjtcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge3JhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IERhbWFnZUR1c3QgPSByZXF1aXJlKCcuLi9wYXJ0aWNsZXMvRGFtYWdlRHVzdCcpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIFByb2plY3RpbGUgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCB2eCwgdnksIHRpbWUsIGRhbWFnZSwgZnJpZW5kbHkpIHtcblx0XHRsZXQgbGF5ZXIgPSBmcmllbmRseSA/IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuRlJJRU5ETFlfUFJPSkVDVElMRSA6IEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9QUk9KRUNUSUxFO1xuXHRcdHN1cGVyKHgsIHksIHdpZHRoLCBoZWlnaHQsIGxheWVyKTtcblx0XHR0aGlzLnZ4ID0gdng7XG5cdFx0dGhpcy52eSA9IHZ5O1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdFx0dGhpcy5jb2xvciA9IGZyaWVuZGx5ID8gQ29sb3JzLkVudGl0eS5GUklFTkRMWV9QUk9KRUNUSUxFLmdldCgpIDogQ29sb3JzLkVudGl0eS5IT1NUSUxFX1BST0pFQ1RJTEUuZ2V0KClcblx0fVxuXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlcikgeyAvLyB0b2RvIFttZWRpdW1dIGZpeCBuYW1pbmcgZGlzY29ubmVjdCwgbWFwIHJlZmVycyB0byBsYXNlcnMgYW5kIHByb2plY3RpbGVzIGFzIHByb2plY3RpbGVzLiBlbnRpdGllcyByZWZlciB0byBsYXNlciBhbmQgcHJvamVjdGlsZSBhcyBhdHRhY2tzLiBjcmVhdGUgcHJvamVjdGlsZS9hdHRhY2sgcGFyZW50IGNsYXNzIHRvIGhhdmUgdXBkYXRlIGludGVyZmFjZVxuXHRcdGNvbnN0IEZSSUNUSU9OID0gMTtcblxuXHRcdGxldCBpbnRlcnNlY3Rpb24gPSB0aGlzLnF1ZXVlZFRyYWNrZWRJbnRlcnNlY3Rpb25zWzBdIHx8IHRoaXMuc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLnZ4LCB0aGlzLnZ5LCAtMSwgdHJ1ZSkucmVmZXJlbmNlO1xuXG5cdFx0aWYgKGludGVyc2VjdGlvbikge1xuXHRcdFx0aW50ZXJzZWN0aW9uLmNoYW5nZUhlYWx0aCgtdGhpcy5kYW1hZ2UpO1xuXHRcdFx0bWFwLmFkZFBhcnRpY2xlKG5ldyBEYW1hZ2VEdXN0KHRoaXMueCwgdGhpcy55LCAuMDA1LCAuLi5yYW5kVmVjdG9yKC4wMDEpLCAxMDApKTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICghdGhpcy50aW1lLS0pXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdHRoaXMudnggKj0gRlJJQ1RJT047XG5cdFx0dGhpcy52eSAqPSBGUklDVElPTjtcblxuXHRcdC8vIHRvZG8gW2xvd10gZG8gZGFtYWdlIHdoZW4gY29sbGlkZWQgd2l0aCAoYXMgb3Bwb3NlZCB0byB3aGVuIGNvbGxpZGluZylcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogdGhpcy5jb2xvcn0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByb2plY3RpbGU7XG4iLCJjb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi91dGlsL1ZlY3RvcicpO1xyXG5jb25zdCB7bWluV2hpY2hBLCBjbGFtcCwgcmFuZCwgcmFuZEludH0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xyXG5cclxuY29uc3QgUHJvamVjdGlsZUF0dGFjayA9IHJlcXVpcmUoJy4uLy4uL2FiaWxpdGllcy9Qcm9qZWN0aWxlQXR0YWNrJyk7XHJcblxyXG5jbGFzcyBFZ2dCb3Qge1xyXG5cdGNvbnN0cnVjdG9yKHBsYXllciwgY29vcEJvdEhlcm9lcywgaG9zdGlsZUJvdEhlcm9lcywgZWdnLCBjZW50ZXJEaXIpIHtcclxuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xyXG5cdFx0dGhpcy5jb29wQm90SGVyb2VzID0gY29vcEJvdEhlcm9lcztcclxuXHRcdHRoaXMuaG9zdGlsZUJvdEhlcm9lcyA9IGhvc3RpbGVCb3RIZXJvZXM7XHJcblx0XHR0aGlzLmVnZyA9IGVnZztcclxuXHRcdHRoaXMuY2VudGVyRGlyID0gY2VudGVyRGlyO1xyXG5cdH1cclxuXHJcblx0Z2V0IGJvdEhlcm9lcygpIHtcclxuXHRcdHJldHVybiBbLi4udGhpcy5jb29wQm90SGVyb2VzLCAuLi50aGlzLmhvc3RpbGVCb3RIZXJvZXNdO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XHJcblx0XHR0aGlzLmVnZy51cGRhdGUobWFwKTtcclxuXHRcdGxldCB0YXJnZXQgPSB0aGlzLmVnZy5vd25lckhlcm8gfHwgdGhpcy5lZ2c7XHJcblx0XHRsZXQgZnJpZW5kbGllcyA9IFt0aGlzLnBsYXllciwgLi4udGhpcy5jb29wQm90SGVyb2VzXS5maWx0ZXIoYm90SGVybyA9PiAhYm90SGVyby5oZWFsdGguaXNFbXB0eSgpKTtcclxuXHRcdGxldCBob3N0aWxlcyA9IHRoaXMuaG9zdGlsZUJvdEhlcm9lcy5maWx0ZXIoYm90SGVybyA9PiAhYm90SGVyby5oZWFsdGguaXNFbXB0eSgpKTtcclxuXHJcblx0XHR0aGlzLmNvb3BCb3RIZXJvZXMuZm9yRWFjaChib3RIZXJvID0+IHtcclxuXHRcdFx0bGV0IGdvYWxzID0gRWdnQm90Lmhlcm9Hb2Fscyhib3RIZXJvLCBmcmllbmRsaWVzLCBob3N0aWxlcywgdGFyZ2V0LCB0aGlzLmNlbnRlckRpcik7XHJcblx0XHRcdGJvdEhlcm8udXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLCBnb2Fscyk7XHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLmhvc3RpbGVCb3RIZXJvZXMuZm9yRWFjaChib3RIZXJvID0+IHtcclxuXHRcdFx0bGV0IGdvYWxzID0gRWdnQm90Lmhlcm9Hb2Fscyhib3RIZXJvLCBob3N0aWxlcywgZnJpZW5kbGllcywgdGFyZ2V0LCB0aGlzLmNlbnRlckRpcik7XHJcblx0XHRcdGJvdEhlcm8udXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLCBnb2Fscyk7XHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBoZXJvR29hbHMoaGVybywgYWxsaWVzLCBob3N0aWxlcywgdGFyZ2V0LCBjZW50ZXJEaXIpIHtcclxuXHRcdGxldCBtb3ZlbWVudCA9IEVnZ0JvdC5oZXJvTW92ZW1lbnQoaGVybywgYWxsaWVzLCBob3N0aWxlcywgdGFyZ2V0LCBjZW50ZXJEaXIpO1xyXG5cdFx0bGV0IG1vdmVtZW50TWFnU3FyID0gbW92ZW1lbnQubWFnbml0dWRlU3FyO1xyXG5cdFx0aWYgKG1vdmVtZW50TWFnU3FyKVxyXG5cdFx0XHRtb3ZlbWVudC5tYWduaXR1ZGUgPSAxO1xyXG5cclxuXHRcdGxldCBhYmlsaXRpZXNEaXJlY3QgPSBob3N0aWxlcy5sZW5ndGggPyBFZ2dCb3QuY2xvc2VzdEhvc3RpbGVEaXIoaGVybywgaG9zdGlsZXMpIDogbmV3IFZlY3RvcigwLCAwKTtcclxuXHRcdGFiaWxpdGllc0RpcmVjdC5hZGQoVmVjdG9yLmZyb21SYW5kKGFiaWxpdGllc0RpcmVjdC5tYWduaXR1ZGUgLyA1KSk7XHJcblxyXG5cdFx0Ly8gdG9kbyBbaGlnaF0gdHVuZVxyXG5cdFx0bGV0IHByb2plY3RpbGVBdHRhY2tEaXN0YW5jZSA9IFByb2plY3RpbGVBdHRhY2suZ2V0VGltZShoZXJvKSAqIFByb2plY3RpbGVBdHRhY2sudmVsb2NpdHkgKyAuMTtcclxuXHRcdC8vIDAuOTQgMCBJbmZpbml0eVxyXG5cdFx0bGV0IGFjdGl2ZVByb2plY3RpbGVBdHRhY2sgPSByYW5kKCkgPCAocHJvamVjdGlsZUF0dGFja0Rpc3RhbmNlIC8gYWJpbGl0aWVzRGlyZWN0Lm1hZ25pdHVkZSAtIC45KSAqIDU7XHJcblx0XHRsZXQgYWN0aXZlQWJpbGl0aWVzV2FudGVkID0gW1xyXG5cdFx0XHRob3N0aWxlcy5sZW5ndGggJiYgYWN0aXZlUHJvamVjdGlsZUF0dGFjayxcclxuXHRcdFx0bW92ZW1lbnRNYWdTcXIgPiAuMSAmJiBtb3ZlbWVudE1hZ1NxciA8IDMgJiYgcmFuZCgpIDwgLjA0LCAvLyBkYXNoXHJcblx0XHRcdGhlcm8ucmVjZW50RGFtYWdlLmdldCgpID4gLjgsIC8vIGluY3JlYXNlIGRlZmVuc2VcclxuXHRcdF07XHJcblxyXG5cdFx0cmV0dXJuIHttb3ZlbWVudCwgYWN0aXZlQWJpbGl0aWVzV2FudGVkLCBhYmlsaXRpZXNEaXJlY3R9O1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGhlcm9Nb3ZlbWVudChoZXJvLCBhbGxpZXMsIGhvc3RpbGVzLCB0YXJnZXQsIGNlbnRlckRpcikge1xyXG5cdFx0Ly8gdG9kbyBbaGlnaF0gdHVuZVxyXG5cdFx0bGV0IG1vdmVtZW50ID0gbmV3IFZlY3RvcigwLCAwKTtcclxuXHRcdGxldCBwb3MgPSBWZWN0b3IuZnJvbU9iaihoZXJvKTtcclxuXHJcblx0XHRsZXQgc2VsZlRhcmdldCA9IGhlcm8gPT09IHRhcmdldDtcclxuXHRcdGxldCBhbGxpZWRUYXJnZXQgPSBmYWxzZTtcclxuXHRcdGxldCBob3N0aWxlVGFyZ2V0ID0gZmFsc2U7XHJcblxyXG5cdFx0bGV0IGFsbGllc01vdmVtZW50ID0gYWxsaWVzLnJlZHVjZSgobW92ZW1lbnQsIGFsbHkpID0+IHtcclxuXHRcdFx0aWYgKGFsbHkgPT09IGhlcm8pXHJcblx0XHRcdFx0cmV0dXJuIG1vdmVtZW50O1xyXG5cdFx0XHRhbGxpZWRUYXJnZXQgPSBhbGxpZWRUYXJnZXQgfHwgYWxseSA9PT0gdGFyZ2V0O1xyXG5cdFx0XHRsZXQgZGVsdGEgPSBFZ2dCb3QubW92ZW1lbnRGbG9jayhwb3MsIFZlY3Rvci5mcm9tT2JqKGFsbHkpLCAuMiwgNCwgMSwgLjUsIDEsIDApO1xyXG5cdFx0XHRyZXR1cm4gbW92ZW1lbnQuYWRkKGRlbHRhKTtcclxuXHRcdH0sIG5ldyBWZWN0b3IoMCwgMCkpO1xyXG5cdFx0YWxsaWVzTW92ZW1lbnQubXVsdGlwbHkoMSAvIChhbGxpZXMubGVuZ3RoICsgMSkpO1xyXG5cclxuXHRcdGxldCBpZGVhbEhvc3RpbGVEaXN0ID0gc2VsZlRhcmdldCA/IC45IDogLjQ7XHJcblx0XHRsZXQgaG9zdGlsZXNNb3ZlbWVudCA9IGhvc3RpbGVzLnJlZHVjZSgobW92ZW1lbnQsIGhvc3RpbGUpID0+IHtcclxuXHRcdFx0aG9zdGlsZVRhcmdldCA9IGhvc3RpbGVUYXJnZXQgfHwgaG9zdGlsZSA9PT0gdGFyZ2V0O1xyXG5cdFx0XHRsZXQgZGVsdGEgPSBFZ2dCb3QubW92ZW1lbnRGbG9jayhwb3MsIFZlY3Rvci5mcm9tT2JqKGhvc3RpbGUpLCBpZGVhbEhvc3RpbGVEaXN0LCAxLCAxKTtcclxuXHRcdFx0cmV0dXJuIG1vdmVtZW50LmFkZChkZWx0YSk7XHJcblx0XHR9LCBuZXcgVmVjdG9yKDAsIDApKTtcclxuXHRcdGhvc3RpbGVzTW92ZW1lbnQubXVsdGlwbHkoMSAvIChob3N0aWxlcy5sZW5ndGggKyAxKSk7XHJcblxyXG5cdFx0bGV0IHRhcmdldERpc3QgPSAhYWxsaWVkVGFyZ2V0ICYmICFob3N0aWxlVGFyZ2V0ID8gMCA6IC4zO1xyXG5cdFx0bGV0IHRhcmdldE1vdmVtZW50ID0gRWdnQm90Lm1vdmVtZW50RmxvY2soaGVybywgVmVjdG9yLmZyb21PYmoodGFyZ2V0KSwgdGFyZ2V0RGlzdCwgMSwgNCwgLjAxLCAyLCAxKTtcclxuXHJcblx0XHRpZiAocmFuZCgpID4gLjk5NiB8fCAhaGVyby5hdm9pZExpbmVNb3ZlbWVudERpcmVjdGlvbilcclxuXHRcdFx0aGVyby5hdm9pZExpbmVNb3ZlbWVudERpcmVjdGlvbiA9IHJhbmRJbnQoMikgKiAyIC0gMTtcclxuXHRcdGxldCBhdm9pZExpbmVNb3ZlbWVudCA9IGhvc3RpbGVzLnJlZHVjZSgobW92ZW1lbnQsIGhvc3RpbGUpID0+IHtcclxuXHRcdFx0bGV0IGRlbHRhID0gVmVjdG9yLmZyb21PYmooaG9zdGlsZSkuc3VidHJhY3QocG9zKTtcclxuXHRcdFx0ZGVsdGEucm90YXRlQnlDb3NTaW4oMCwgaGVyby5hdm9pZExpbmVNb3ZlbWVudERpcmVjdGlvbiAqIG1vdmVtZW50LmNyb3NzKGRlbHRhKSA+IDAgPyAtMSA6IDEpO1xyXG5cdFx0XHRkZWx0YS5tYWduaXR1ZGUgPSBjbGFtcCgxLjI1ICogLjQgLSBkZWx0YS5tYWduaXR1ZGUgKiAuNCwgMCwgMSk7XHJcblx0XHRcdHJldHVybiBtb3ZlbWVudC5hZGQoZGVsdGEpO1xyXG5cdFx0fSwgbmV3IFZlY3RvcigwLCAwKSk7XHJcblxyXG5cdFx0Ly8gdG9kbyBbaGlnaF0gY29uZGl0aW9uYWwgb24gaGF2aW5nIHRhcmdldFxyXG5cdFx0bGV0IGNlbnRlck1vdmVtZW50ID0gY2VudGVyRGlyLmNvcHkuc3VidHJhY3QocG9zKTtcclxuXHRcdGNlbnRlck1vdmVtZW50Lm1hZ25pdHVkZSA9IC4xO1xyXG5cclxuXHRcdG1vdmVtZW50XHJcblx0XHRcdC5hZGQoYWxsaWVzTW92ZW1lbnQpXHJcblx0XHRcdC5hZGQoaG9zdGlsZXNNb3ZlbWVudClcclxuXHRcdFx0LmFkZCh0YXJnZXRNb3ZlbWVudClcclxuXHRcdFx0LmFkZChhdm9pZExpbmVNb3ZlbWVudClcclxuXHRcdFx0LmFkZChjZW50ZXJNb3ZlbWVudCk7XHJcblx0XHRyZXR1cm4gbW92ZW1lbnQ7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgbW92ZW1lbnRGbG9jayhvcmlnaW4sIHRhcmdldCxcclxuXHQgICAgICAgICAgICAgICAgICAgICBpZGVhbERpc3QsIG1heFJlcHVsc2UgPSAxLCBtYXhBdHRyYWN0ID0gbWF4UmVwdWxzZSxcclxuXHQgICAgICAgICAgICAgICAgICAgICBmYWRlU3RhcnREaXN0ID0gaWRlYWxEaXN0ICogMiwgZmFkZUVuZERpc3QgPSBmYWRlU3RhcnREaXN0ICogMiwgZmFkZUF0dHJhY3QgPSBNYXRoLm1pbihtYXhBdHRyYWN0LCAuMDUpKSB7XHJcblx0XHQvLyBvcmlnaW4gd29uJ3QgYmUgbW9kaWZpZWQuIHRhcmdldCB3aWxsIGJlIG1vZGlmaWVkLlxyXG5cdFx0bGV0IGRlbHRhID0gdGFyZ2V0LnN1YnRyYWN0KG9yaWdpbik7XHJcblx0XHRsZXQgbWFnbml0dWRlID0gZGVsdGEubWFnbml0dWRlO1xyXG5cdFx0aWYgKCFtYWduaXR1ZGUpXHJcblx0XHRcdHJldHVybiBkZWx0YTtcclxuXHRcdGxldCBkaXN0YW5jZVRvRm9yY2UgPSBbWzAsIC1tYXhSZXB1bHNlXSwgW2lkZWFsRGlzdCwgMF0sIFtmYWRlU3RhcnREaXN0LCBtYXhBdHRyYWN0XSwgW2ZhZGVFbmREaXN0LCBmYWRlQXR0cmFjdF0sIFtJbmZpbml0eSwgZmFkZUF0dHJhY3RdXTtcclxuXHRcdGxldCBtYXhGb3JjZUluZGV4ID0gZGlzdGFuY2VUb0ZvcmNlLmZpbmRJbmRleCgoW2Rpc3RhbmNlXSkgPT4gbWFnbml0dWRlIDwgZGlzdGFuY2UpO1xyXG5cdFx0bGV0IGJsZW5kID0gKG1hZ25pdHVkZSAtIGRpc3RhbmNlVG9Gb3JjZVttYXhGb3JjZUluZGV4IC0gMV1bMF0pIC8gKGRpc3RhbmNlVG9Gb3JjZVttYXhGb3JjZUluZGV4XVswXSAtIGRpc3RhbmNlVG9Gb3JjZVttYXhGb3JjZUluZGV4IC0gMV1bMF0pO1xyXG5cdFx0ZGVsdGEubWFnbml0dWRlID0gYmxlbmQgKiBkaXN0YW5jZVRvRm9yY2VbbWF4Rm9yY2VJbmRleF1bMV0gKyAoMSAtIGJsZW5kKSAqIGRpc3RhbmNlVG9Gb3JjZVttYXhGb3JjZUluZGV4IC0gMV1bMV07XHJcblx0XHRyZXR1cm4gZGVsdGE7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgY2xvc2VzdEhvc3RpbGVEaXIoaGVybywgaG9zdGlsZXMpIHtcclxuXHRcdGxldCBwb3MgPSBWZWN0b3IuZnJvbU9iaihoZXJvKTtcclxuXHRcdGxldCBkZWx0YXMgPSBob3N0aWxlcy5tYXAoaG9zdGlsZSA9PiBWZWN0b3IuZnJvbU9iaihob3N0aWxlKS5zdWJ0cmFjdChwb3MpKTtcclxuXHRcdGxldCBpID0gbWluV2hpY2hBKGRlbHRhcy5tYXAoZGVsdGEgPT4gZGVsdGEubWFnbml0dWRlKSk7XHJcblxyXG5cdFx0bGV0IHByb2plY3RlZE1vdmVtZW50ID0gbmV3IFZlY3RvciguLi5ob3N0aWxlc1tpXS5jdXJyZW50TW92ZSk7XHJcblx0XHRpZiAocHJvamVjdGVkTW92ZW1lbnQubWFnbml0dWRlKSB7XHJcblx0XHRcdHByb2plY3RlZE1vdmVtZW50Lm1hZ25pdHVkZSA9IC4zICogZGVsdGFzW2ldLm1hZ25pdHVkZTsgLy8gLjAxNCAocHJvamVjdGlsZSB2KSAvIC4wMDUgKGhlcm8gdikgPSAuM1xyXG5cdFx0XHRkZWx0YXNbaV0uYWRkKHByb2plY3RlZE1vdmVtZW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBkZWx0YXNbaV07XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEVnZ0JvdDtcclxuIiwiY29uc3QgSGVybyA9IHJlcXVpcmUoJy4vSGVybycpO1xyXG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi4vQnVmZicpO1xyXG5cclxuY2xhc3MgQm90SGVybyBleHRlbmRzIEhlcm8ge1xyXG5cdHVwZGF0ZShtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgbW9uc3Rlcktub3dsZWRnZSwgZ29hbHMpIHtcclxuXHRcdHRoaXMucmVmcmVzaCgpO1xyXG5cdFx0dGhpcy51cGRhdGVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZ29hbHMubW92ZW1lbnQueCwgZ29hbHMubW92ZW1lbnQueSwgLjAwNSAqIEJ1ZmYubW92ZVNwZWVkKHRoaXMuYnVmZnMpKTtcclxuXHRcdC8vIHRvZG8gW21lZGl1bV0gc3BlZWQgc2hvdWxkIGJlIHBhcmFtZXRlcml6YWJsZSBpbiBIZXJvIGNvbnN0cnVjdG9yLlxyXG5cdFx0dGhpcy51cGRhdGVBYmlsaXRpZXMobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIGdvYWxzLmFjdGl2ZUFiaWxpdGllc1dhbnRlZCwgZ29hbHMuYWJpbGl0aWVzRGlyZWN0KTtcclxuXHRcdHRoaXMuY3JlYXRlTW92ZW1lbnRQYXJ0aWNsZShtYXApO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb3RIZXJvO1xyXG4iLCJjb25zdCBMaXZpbmdFbnRpdHkgPSByZXF1aXJlKCcuLi9MaXZpbmdFbnRpdHknKTtcclxuY29uc3QgRGVjYXkgPSByZXF1aXJlKCcuLi8uLi91dGlsL0RlY2F5Jyk7XHJcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcclxuY29uc3QgUG9vbCA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvUG9vbCcpO1xyXG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi4vQnVmZicpO1xyXG5jb25zdCB7c2V0TWFnbml0dWRlLCBib29sZWFuQXJyYXksIHJhbmQsIHJhbmRWZWN0b3J9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuY29uc3QgRHVzdCA9IHJlcXVpcmUoJy4uL3BhcnRpY2xlcy9EdXN0Jyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgQmFyQyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyQycpO1xyXG5cclxuY2xhc3MgSGVybyBleHRlbmRzIExpdmluZ0VudGl0eSB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgaGVhbHRoLCBzdGFtaW5hLCBzdGFtaW5hUmVmcmVzaCwgZnJpZW5kbHksIGFiaWxpdGllcywgcGFzc2l2ZUFiaWxpdGllcywgbmFtZXBsYXRlTGlmZUNvbG9yLCBuYW1lcGxhdGVTdGFtaW5hQ29sb3IpIHtcclxuXHRcdGxldCBsYXllciA9IGZyaWVuZGx5ID8gSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5GUklFTkRMWV9VTklUIDogSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5IT1NUSUxFX1VOSVQ7XHJcblx0XHRzdXBlcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBoZWFsdGgsIGxheWVyKTtcclxuXHRcdHRoaXMuc3RhbWluYSA9IG5ldyBQb29sKHN0YW1pbmEsIHN0YW1pbmFSZWZyZXNoKTsgLy8gdG9kbyBbbWVkaXVtXSBjb25zaWRlciByZXBsYWNpbmcgc3RhbWluYVJlZnJlc2ggd2l0aCBwYXNzaXZlIGFiaWxpdHlcclxuXHRcdHRoaXMuZnJpZW5kbHkgPSBmcmllbmRseTtcclxuXHRcdHRoaXMuYWJpbGl0aWVzID0gYWJpbGl0aWVzO1xyXG5cdFx0dGhpcy5wYXNzaXZlQWJpbGl0aWVzID0gcGFzc2l2ZUFiaWxpdGllcztcclxuXHRcdHRoaXMubmFtZXBsYXRlTGlmZUNvbG9yID0gbmFtZXBsYXRlTGlmZUNvbG9yO1xyXG5cdFx0dGhpcy5uYW1lcGxhdGVTdGFtaW5hQ29sb3IgPSBuYW1lcGxhdGVTdGFtaW5hQ29sb3I7XHJcblx0XHR0aGlzLnJlY2VudERhbWFnZSA9IG5ldyBEZWNheSguMSwgLjAwMSk7XHJcblx0XHR0aGlzLmN1cnJlbnRNb3ZlID0gWzAsIDBdO1xyXG5cdH1cclxuXHJcblx0cmVmcmVzaCgpIHtcclxuXHRcdHN1cGVyLnJlZnJlc2goKTtcclxuXHRcdHRoaXMucmVjZW50RGFtYWdlLmRlY2F5KCk7XHJcblx0XHR0aGlzLnN0YW1pbmEuaW5jcmVtZW50KCk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpIHtcclxuXHRcdGlmIChCdWZmLmRpc2FibGVkKHRoaXMuYnVmZnMpKVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR0aGlzLmN1cnJlbnRNb3ZlID0gW2R4LCBkeV07XHJcblx0XHR0aGlzLnNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCBtYWduaXR1ZGUsIG5vU2xpZGUpO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlQWJpbGl0aWVzKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBhY3RpdmVBYmlsaXRpZXNXYW50ZWQsIGRpcmVjdCkge1xyXG5cdFx0bGV0IGRpc2FibGVkID0gQnVmZi5kaXNhYmxlZCh0aGlzLmJ1ZmZzKTtcclxuXHRcdGlmICghZGlzYWJsZWQpXHJcblx0XHRcdHRoaXMuYWJpbGl0aWVzLmZvckVhY2goKGFiaWxpdHksIGkpID0+XHJcblx0XHRcdFx0YWJpbGl0eS51cGRhdGUodGhpcywgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGhpcywgYWN0aXZlQWJpbGl0aWVzV2FudGVkW2ldKSk7XHJcblx0XHR0aGlzLnBhc3NpdmVBYmlsaXRpZXMuZm9yRWFjaChhYmlsaXR5ID0+IHtcclxuXHRcdFx0aWYgKCFkaXNhYmxlZCB8fCBhYmlsaXR5LmRpc2FibGVkT2spXHJcblx0XHRcdFx0YWJpbGl0eS51cGRhdGUodGhpcywgZGlyZWN0LCBtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGhpcywgdHJ1ZSlcclxuXHRcdH0pO1xyXG5cdH1cclxuXHJcblx0Y3JlYXRlTW92ZW1lbnRQYXJ0aWNsZShtYXApIHtcclxuXHRcdGNvbnN0IFJBVEUgPSAuMiwgU0laRSA9IC4wMDUsIERJUkVDVF9WRUxPQ0lUWSA9IC4wMDMsIFJBTkRfVkVMT0NJVFkgPSAuMDAxO1xyXG5cclxuXHRcdGlmICghYm9vbGVhbkFycmF5KHRoaXMuY3VycmVudE1vdmUpIHx8IHJhbmQoKSA+IFJBVEUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgZGlyZWN0diA9IHNldE1hZ25pdHVkZSguLi50aGlzLmN1cnJlbnRNb3ZlLCAtRElSRUNUX1ZFTE9DSVRZKTtcclxuXHRcdGxldCByYW5kdiA9IHJhbmRWZWN0b3IoUkFORF9WRUxPQ0lUWSk7XHJcblxyXG5cdFx0bWFwLmFkZFBhcnRpY2xlKG5ldyBEdXN0KHRoaXMueCwgdGhpcy55LCBTSVpFLCBkaXJlY3R2LnggKyByYW5kdlswXSwgZGlyZWN0di55ICsgcmFuZHZbMV0sIDEwMCkpO1xyXG5cdH1cclxuXHJcblx0c3VmZmljaWVudFN0YW1pbmEoYW1vdW50KSB7XHJcblx0XHRyZXR1cm4gYW1vdW50IDw9IHRoaXMuc3RhbWluYS5nZXQoKTtcclxuXHR9XHJcblxyXG5cdGNvbnN1bWVTdGFtaW5hKGFtb3VudCkge1xyXG5cdFx0dGhpcy5zdGFtaW5hLmNoYW5nZSgtYW1vdW50KTtcclxuXHR9XHJcblxyXG5cdGNoYW5nZUhlYWx0aChhbW91bnQpIHtcclxuXHRcdHN1cGVyLmNoYW5nZUhlYWx0aChhbW91bnQpO1xyXG5cdFx0dGhpcy5yZWNlbnREYW1hZ2UuYWRkKC1hbW91bnQpO1xyXG5cdH1cclxuXHJcblx0cmVzdG9yZUhlYWx0aCgpIHtcclxuXHRcdHN1cGVyLnJlc3RvcmVIZWFsdGgoKTtcclxuXHRcdHRoaXMuc3RhbWluYS5yZXN0b3JlKCk7XHJcblx0fVxyXG5cclxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcclxuXHRcdGNvbnN0IEJBUl9XSURUSCA9IC4xNSwgTElGRV9IRUlHSFQgPSAuMDIsIFNUQU1JTkFfSEVJR0hUID0gLjAxLCBNQVJHSU4gPSAuMDA1O1xyXG5cdFx0c3VwZXIucGFpbnQocGFpbnRlciwgY2FtZXJhKTtcclxuXHRcdC8vIGxpZmUgYmFyXHJcblx0XHRwYWludGVyLmFkZChCYXJDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSAtIHRoaXMuaGVpZ2h0IC0gKExJRkVfSEVJR0hUICsgU1RBTUlOQV9IRUlHSFQpIC8gMiAtIE1BUkdJTiwgQkFSX1dJRFRILCBMSUZFX0hFSUdIVCwgdGhpcy5oZWFsdGguZ2V0UmF0aW8oKSxcclxuXHRcdFx0dGhpcy5uYW1lcGxhdGVMaWZlQ29sb3IuZ2V0U2hhZGUoQ29sb3JzLkJBUl9TSEFESU5HKSwgdGhpcy5uYW1lcGxhdGVMaWZlQ29sb3IuZ2V0KCksIHRoaXMubmFtZXBsYXRlTGlmZUNvbG9yLmdldChDb2xvcnMuQkFSX1NIQURJTkcpKSk7XHJcblx0XHQvLyBzdGFtaW5hIGJhclxyXG5cdFx0cGFpbnRlci5hZGQoQmFyQy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnkgLSB0aGlzLmhlaWdodCwgQkFSX1dJRFRILCBTVEFNSU5BX0hFSUdIVCwgdGhpcy5zdGFtaW5hLmdldFJhdGlvKCksXHJcblx0XHRcdHRoaXMubmFtZXBsYXRlU3RhbWluYUNvbG9yLmdldFNoYWRlKENvbG9ycy5CQVJfU0hBRElORyksIHRoaXMubmFtZXBsYXRlU3RhbWluYUNvbG9yLmdldCgpLCB0aGlzLm5hbWVwbGF0ZVN0YW1pbmFDb2xvci5nZXQoQ29sb3JzLkJBUl9TSEFESU5HKSkpO1xyXG5cdFx0Ly8gYnVmZnNcclxuXHRcdGxldCBidWZmU2l6ZSA9IExJRkVfSEVJR0hUICsgU1RBTUlOQV9IRUlHSFQgKyBNQVJHSU47XHJcblx0XHR0aGlzLmJ1ZmZzLmZvckVhY2goKGJ1ZmYsIGkpID0+XHJcblx0XHRcdGJ1ZmYucGFpbnRBdChwYWludGVyLCBjYW1lcmEsXHJcblx0XHRcdFx0dGhpcy54ICsgQkFSX1dJRFRIIC8gMiArIE1BUkdJTiArIChidWZmU2l6ZSArIE1BUkdJTikgKiBpLFxyXG5cdFx0XHRcdHRoaXMueSAtIHRoaXMuaGVpZ2h0IC0gYnVmZlNpemUgKyBTVEFNSU5BX0hFSUdIVCAvIDIsXHJcblx0XHRcdFx0YnVmZlNpemUpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSGVybztcclxuIiwiY29uc3QgSGVybyA9IHJlcXVpcmUoJy4vSGVybycpO1xyXG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XHJcbmNvbnN0IHtDb2xvcnMsIFBvc2l0aW9uc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBWU2hpcCA9IHJlcXVpcmUoJy4uLy4uL2dyYXBoaWNzL1ZTaGlwJyk7XHJcbmNvbnN0IFByb2plY3RpbGVBdHRhY2sgPSByZXF1aXJlKCcuLi8uLi9hYmlsaXRpZXMvUHJvamVjdGlsZUF0dGFjaycpO1xyXG5jb25zdCBEYXNoID0gcmVxdWlyZSgnLi4vLi4vYWJpbGl0aWVzL0Rhc2gnKTtcclxuY29uc3QgSW5jRGVmZW5zZSA9IHJlcXVpcmUoJy4uLy4uL2FiaWxpdGllcy9JbmNEZWZlbnNlJyk7XHJcbmNvbnN0IERlbGF5ZWRSZWdlbiA9IHJlcXVpcmUoJy4uLy4uL2FiaWxpdGllcy9EZWxheWVkUmVnZW4nKTtcclxuY29uc3QgQnVmZiA9IHJlcXVpcmUoJy4uLy4vQnVmZicpO1xyXG5jb25zdCBLZXltYXBwaW5nID0gcmVxdWlyZSgnLi4vLi4vY29udHJvbC9LZXltYXBwaW5nJyk7XHJcbmNvbnN0IEJvdW5kcyA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9Cb3VuZHMnKTtcclxuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL1JlY3RDJyk7XHJcbmNvbnN0IEJhciA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyJyk7XHJcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL1JlY3QnKTtcclxuXHJcbmNvbnN0IFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFID0gLjA0O1xyXG5cclxuY2xhc3MgUGxheWVyIGV4dGVuZHMgSGVybyB7XHJcblx0Ly8gdG9kbyBbbWVkaXVtXSBkZXByZWNhdGVkXHJcblx0c3RhdGljIGRlZmF1bHRDb25zdHJ1Y3RvcigpIHtcclxuXHRcdGxldCBhYmlsaXRpZXMgPSBbXHJcblx0XHRcdG5ldyBQcm9qZWN0aWxlQXR0YWNrKCksXHJcblx0XHRcdG5ldyBEYXNoKCksXHJcblx0XHRcdG5ldyBJbmNEZWZlbnNlKCksXHJcblx0XHRdO1xyXG5cdFx0YWJpbGl0aWVzLmZvckVhY2goKGFiaWxpdHksIGkpID0+IGFiaWxpdHkuc2V0VWkoaSkpO1xyXG5cdFx0bGV0IHBhc3NpdmVBYmlsaXRpZXMgPSBbXHJcblx0XHRcdG5ldyBEZWxheWVkUmVnZW4oKSxcclxuXHRcdF07XHJcblxyXG5cdFx0bGV0IHBsYXllciA9IG5ldyBQbGF5ZXIoMCwgMCwgLjA1LCAuMDUsIDEsIDgwLCAuMTMsIHRydWUsIGFiaWxpdGllcywgcGFzc2l2ZUFiaWxpdGllcywgQ29sb3JzLkxJRkUsIENvbG9ycy5TVEFNSU5BKTtcclxuXHRcdHBsYXllci5zZXRHcmFwaGljcyhuZXcgVlNoaXAoLjA1LCAuMDUsIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5QTEFZRVIuZ2V0KCl9KSk7XHJcblx0XHRyZXR1cm4gcGxheWVyO1xyXG5cdH1cclxuXHJcblx0dXBkYXRlKG1hcCwgY29udHJvbGxlciwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XHJcblx0XHR0aGlzLnJlZnJlc2goKTtcclxuXHRcdHRoaXMubW92ZUNvbnRyb2woY29udHJvbGxlciwgaW50ZXJzZWN0aW9uRmluZGVyKTtcclxuXHRcdHRoaXMuYWJpbGl0eUNvbnRyb2wobWFwLCBjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIpO1xyXG5cdFx0dGhpcy50YXJnZXRMb2NrQ29udHJvbChjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIpO1xyXG5cdFx0dGhpcy5jcmVhdGVNb3ZlbWVudFBhcnRpY2xlKG1hcCk7XHJcblx0fVxyXG5cclxuXHRtb3ZlQ29udHJvbChjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIpIHtcclxuXHRcdGNvbnN0IGludlNxcnQyID0gMSAvIE1hdGguc3FydCgyKTtcclxuXHJcblx0XHRsZXQgbGVmdCA9IEtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuTU9WRV9MRUZUKS5hY3RpdmU7XHJcblx0XHRsZXQgdXAgPSBLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLk1PVkVfVVApLmFjdGl2ZTtcclxuXHRcdGxldCByaWdodCA9IEtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuTU9WRV9SSUdIVCkuYWN0aXZlO1xyXG5cdFx0bGV0IGRvd24gPSBLZXltYXBwaW5nLmdldENvbnRyb2xTdGF0ZShjb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLk1PVkVfRE9XTikuYWN0aXZlO1xyXG5cclxuXHRcdGxldCBkeCA9IDAsIGR5ID0gMDtcclxuXHJcblx0XHRpZiAobGVmdClcclxuXHRcdFx0ZHggLT0gMTtcclxuXHRcdGlmICh1cClcclxuXHRcdFx0ZHkgLT0gMTtcclxuXHRcdGlmIChyaWdodClcclxuXHRcdFx0ZHggKz0gMTtcclxuXHRcdGlmIChkb3duKVxyXG5cdFx0XHRkeSArPSAxO1xyXG5cclxuXHRcdGlmIChkeCAmJiBkeSkge1xyXG5cdFx0XHRkeCA9IE1hdGguc2lnbihkeCkgKiBpbnZTcXJ0MjtcclxuXHRcdFx0ZHkgPSBNYXRoLnNpZ24oZHkpICogaW52U3FydDI7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy51cGRhdGVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgZHgsIGR5LCAuMDA1ICogQnVmZi5tb3ZlU3BlZWQodGhpcy5idWZmcykpO1xyXG5cdH1cclxuXHJcblx0YWJpbGl0eUNvbnRyb2wobWFwLCBjb250cm9sbGVyLCBpbnRlcnNlY3Rpb25GaW5kZXIpIHtcclxuXHRcdGxldCBkaXJlY3RUYXJnZXQgPSB0aGlzLnRhcmdldExvY2sgfHwgY29udHJvbGxlci5nZXRNb3VzZSgpO1xyXG5cdFx0bGV0IGRpcmVjdCA9IHtcclxuXHRcdFx0eDogZGlyZWN0VGFyZ2V0LnggLSB0aGlzLngsXHJcblx0XHRcdHk6IGRpcmVjdFRhcmdldC55IC0gdGhpcy55XHJcblx0XHR9O1xyXG5cdFx0bGV0IGFjdGl2ZUFiaWxpdGllc1dhbnRlZCA9IHRoaXMuYWJpbGl0aWVzLm1hcCgoXywgaSkgPT5cclxuXHRcdFx0S2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5Db250cm9scy5BQklMSVRZX0lbaV0pLmFjdGl2ZSk7XHJcblx0XHR0aGlzLnVwZGF0ZUFiaWxpdGllcyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgYWN0aXZlQWJpbGl0aWVzV2FudGVkLCBkaXJlY3QpO1xyXG5cdH1cclxuXHJcblx0dGFyZ2V0TG9ja0NvbnRyb2woY29udHJvbGxlciwgaW50ZXJzZWN0aW9uRmluZGVyKSB7XHJcblx0XHRpZiAodGhpcy50YXJnZXRMb2NrICYmIHRoaXMudGFyZ2V0TG9jay5oZWFsdGguaXNFbXB0eSgpKVxyXG5cdFx0XHR0aGlzLnRhcmdldExvY2sgPSBudWxsO1xyXG5cclxuXHRcdGlmICghS2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUoY29udHJvbGxlciwgS2V5bWFwcGluZy5Db250cm9scy5UQVJHRVRfTE9DSykucHJlc3NlZClcclxuXHRcdFx0cmV0dXJuO1xyXG5cclxuXHRcdGlmICh0aGlzLnRhcmdldExvY2spIHtcclxuXHRcdFx0dGhpcy50YXJnZXRMb2NrID0gbnVsbDtcclxuXHRcdFx0cmV0dXJuO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCBtb3VzZSA9IGNvbnRyb2xsZXIuZ2V0TW91c2UoKTtcclxuXHRcdGxldCB0YXJnZXRMb2NrQm91bmRzID0gbmV3IEJvdW5kcyhcclxuXHRcdFx0bW91c2UueCAtIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFIC8gMixcclxuXHRcdFx0bW91c2UueSAtIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFIC8gMixcclxuXHRcdFx0bW91c2UueCArIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFIC8gMixcclxuXHRcdFx0bW91c2UueSArIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFIC8gMik7XHJcblx0XHR0aGlzLnRhcmdldExvY2sgPSBpbnRlcnNlY3Rpb25GaW5kZXIuaGFzSW50ZXJzZWN0aW9uKEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9VTklULCB0YXJnZXRMb2NrQm91bmRzKTtcclxuXHR9XHJcblxyXG5cdHJlZnJlc2goKSB7XHJcblx0XHRzdXBlci5yZWZyZXNoKCk7XHJcblx0XHR0aGlzLmJ1ZmZzLmZvckVhY2goKGJ1ZmYsIGkpID0+IGJ1ZmYuc2V0VWlJbmRleChpKSk7XHJcblx0fVxyXG5cclxuXHRyZW1vdmVVaSgpIHtcclxuXHRcdHJldHVybiBmYWxzZTtcclxuXHR9XHJcblxyXG5cdHBhaW50VWkocGFpbnRlciwgY2FtZXJhKSB7XHJcblx0XHQvLyB0YXJnZXQgbG9ja1xyXG5cdFx0Ly8gdG9kbyBbbWVkaXVtXSB0YXJnZXQgbG9jayBkcmF3cyBvdmVyIG1vbnN0ZXIgaGVhbHRoIGJhclxyXG5cdFx0aWYgKHRoaXMudGFyZ2V0TG9jaylcclxuXHRcdFx0cGFpbnRlci5hZGQoUmVjdEMud2l0aENhbWVyYShjYW1lcmEsIHRoaXMudGFyZ2V0TG9jay54LCB0aGlzLnRhcmdldExvY2sueSxcclxuXHRcdFx0XHR0aGlzLnRhcmdldExvY2sud2lkdGggKyBUQVJHRVRfTE9DS19CT1JERVJfU0laRSwgdGhpcy50YXJnZXRMb2NrLmhlaWdodCArIFRBUkdFVF9MT0NLX0JPUkRFUl9TSVpFLFxyXG5cdFx0XHRcdHtjb2xvcjogQ29sb3JzLlRBUkdFVF9MT0NLLmdldCgpLCB0aGlja25lc3M6IDN9KSk7XHJcblxyXG5cdFx0Ly8gbGlmZSAmIHN0YW1pbmEgYmFyXHJcblx0XHRjb25zdCBIRUlHSFRfV0lUSF9NQVJHSU4gPSBQb3NpdGlvbnMuQkFSX0hFSUdIVCArIFBvc2l0aW9ucy5NQVJHSU47XHJcblx0XHRwYWludGVyLmFkZChuZXcgQmFyKFBvc2l0aW9ucy5QTEFZRVJfQkFSX1gsIDEgLSBIRUlHSFRfV0lUSF9NQVJHSU4sIDEgLSBQb3NpdGlvbnMuUExBWUVSX0JBUl9YIC0gUG9zaXRpb25zLk1BUkdJTiwgUG9zaXRpb25zLkJBUl9IRUlHSFQsIHRoaXMuc3RhbWluYS5nZXRSYXRpbygpLCBDb2xvcnMuU1RBTUlOQS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpLCBDb2xvcnMuU1RBTUlOQS5nZXQoKSwgQ29sb3JzLlNUQU1JTkEuZ2V0KENvbG9ycy5CQVJfU0hBRElORykpKTtcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBCYXIoUG9zaXRpb25zLlBMQVlFUl9CQVJfWCwgMSAtIEhFSUdIVF9XSVRIX01BUkdJTiAqIDIsIDEgLSBQb3NpdGlvbnMuUExBWUVSX0JBUl9YIC0gUG9zaXRpb25zLk1BUkdJTiwgUG9zaXRpb25zLkJBUl9IRUlHSFQsIHRoaXMuaGVhbHRoLmdldFJhdGlvKCksIENvbG9ycy5MSUZFLmdldFNoYWRlKENvbG9ycy5CQVJfU0hBRElORyksIENvbG9ycy5MSUZFLmdldCgpLCBDb2xvcnMuTElGRS5nZXQoQ29sb3JzLkJBUl9TSEFESU5HKSkpO1xyXG5cclxuXHRcdC8vIGFiaWxpdGllc1xyXG5cdFx0dGhpcy5hYmlsaXRpZXMuZm9yRWFjaChhYmlsaXR5ID0+IGFiaWxpdHkucGFpbnRVaShwYWludGVyLCBjYW1lcmEpKTtcclxuXHJcblx0XHQvLyBidWZmc1xyXG5cdFx0dGhpcy5idWZmcy5mb3JFYWNoKGJ1ZmYgPT4gYnVmZi5wYWludFVpKHBhaW50ZXIsIGNhbWVyYSkpO1xyXG5cclxuXHRcdC8vIGRhbWFnZSBvdmVybGF5XHJcblx0XHRsZXQgZGFtYWdlQ29sb3IgPSBDb2xvcnMuREFNQUdFLmdldEFscGhhKHRoaXMucmVjZW50RGFtYWdlLmdldCgpKTtcclxuXHRcdHBhaW50ZXIuYWRkKG5ldyBSZWN0KDAsIDAsIDEsIDEsIHtmaWxsOiB0cnVlLCBjb2xvcjogZGFtYWdlQ29sb3J9KSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcclxuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9WZWN0b3InKTtcclxuY29uc3Qge2Nvcywgc2lufSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJywgJ1JFVkVSU0UnKTtcclxuXHJcbmNsYXNzIEFpbSBleHRlbmRzIE1vZHVsZSB7XHJcblx0Y29uZmlnKG9yaWdpbiwgcm90YXRpb25TcGVlZCA9IDAsIHNraXJtaXNoVGltZSA9IDAsIHNraXJtaXNoRGlzdGFuY2UgPSAwLCBpbml0aWFsRGlyVmVjdG9yID0gbnVsbCkge1xyXG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XHJcblx0XHR0aGlzLnJvdGF0aW9uU3BlZWQgPSByb3RhdGlvblNwZWVkO1xyXG5cdFx0dGhpcy5yb3RhdGlvblNwZWVkQ29zID0gY29zKHJvdGF0aW9uU3BlZWQpOyAvLyAwIHJvdGF0aW9uU3BlZWQgbWVhbnMgaW5zdGFudCByb3RhdGlvblxyXG5cdFx0dGhpcy5yb3RhdGlvblNwZWVkU2luID0gc2luKHJvdGF0aW9uU3BlZWQpO1xyXG5cdFx0dGhpcy5za2lybWlzaFRpbWUgPSBza2lybWlzaFRpbWU7XHJcblx0XHR0aGlzLnNraXJtaXNoRGlzdGFuY2UgPSBza2lybWlzaERpc3RhbmNlO1xyXG5cdFx0aWYgKGluaXRpYWxEaXJWZWN0b3IpIHtcclxuXHRcdFx0dGhpcy5kaXIgPSBpbml0aWFsRGlyVmVjdG9yO1xyXG5cdFx0XHR0aGlzLmRpci5tYWduaXR1ZGUgPSAxO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuSU5BQ1RJVkUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgZGVsdGEgPSBWZWN0b3IuZnJvbU9iaih0YXJnZXQpLnN1YnRyYWN0KFZlY3Rvci5mcm9tT2JqKHRoaXMub3JpZ2luKSk7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLlJFVkVSU0UpXHJcblx0XHRcdGRlbHRhLm5lZ2F0ZSgpO1xyXG5cclxuXHRcdGlmICh0aGlzLnNraXJtaXNoVGltZSkge1xyXG5cdFx0XHRpZiAoIXRoaXMuc2tpcm1pc2hUaWNrKSB7XHJcblx0XHRcdFx0dGhpcy5za2lybWlzaFRpY2sgPSB0aGlzLnNraXJtaXNoVGltZTtcclxuXHRcdFx0XHR0aGlzLnNraXJtaXNoVmVjID0gVmVjdG9yLmZyb21SYW5kKHRoaXMuc2tpcm1pc2hEaXN0YW5jZSk7XHJcblx0XHRcdFx0aWYgKHRoaXMuc2tpcm1pc2hWZWMuZG90KGRlbHRhKSA+IDApXHJcblx0XHRcdFx0XHR0aGlzLnNraXJtaXNoVmVjLm5lZ2F0ZSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHRoaXMuc2tpcm1pc2hUaWNrLS07XHJcblx0XHRcdGRlbHRhLmFkZCh0aGlzLnNraXJtaXNoVmVjKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMuZGlyKSB7XHJcblx0XHRcdHRoaXMuZGlyID0gVmVjdG9yLmZyb21PYmooZGVsdGEpO1xyXG5cdFx0XHR0aGlzLmRpci5tYWduaXR1ZGUgPSAxO1xyXG5cdFx0fSBlbHNlIGlmICh0aGlzLnJvdGF0aW9uU3BlZWQpXHJcblx0XHRcdHRoaXMuZGlyLnJvdGF0ZUJ5Q29zU2luVG93YXJkcyh0aGlzLnJvdGF0aW9uU3BlZWRDb3MsIHRoaXMucm90YXRpb25TcGVlZFNpbiwgZGVsdGEpO1xyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHRoaXMuZGlyID0gZGVsdGE7XHJcblx0XHRcdHRoaXMuZGlyLm1hZ25pdHVkZSA9IDE7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5BaW0uU3RhZ2VzID0gU3RhZ2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBBaW07XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xuY29uc3QgQXJlYURlZ2VuID0gcmVxdWlyZSgnLi4vYXR0YWNrL0FyZWFEZWdlbicpO1xuXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnV0FSTklORycsICdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcblxuY2xhc3MgQXJlYURlZ2VuTGF5ZXIgZXh0ZW5kcyBNb2R1bGUge1xuXHRjb25maWcob3JpZ2luLCByYW5nZSwgZHVyYXRpb24sIGRhbWFnZSkge1xuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xuXHRcdHRoaXMucmFuZ2UgPSByYW5nZTtcblx0XHR0aGlzLmR1cmF0aW9uID0gZHVyYXRpb247XG5cdFx0dGhpcy5kYW1hZ2UgPSBkYW1hZ2U7XG5cdFx0dGhpcy53YXJuaW5nQXJlYURlZ2VuID0gdGhpcy5hcmVhRGVnZW47XG5cdH1cblxuXHRnZXQgYXJlYURlZ2VuKCkge1xuXHRcdHJldHVybiBuZXcgQXJlYURlZ2VuKHRoaXMub3JpZ2luLngsIHRoaXMub3JpZ2luLnksIHRoaXMucmFuZ2UsIHRoaXMuZHVyYXRpb24sIHRoaXMuZGFtYWdlLCBmYWxzZSlcblx0fVxuXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5XQVJOSU5HKVxuXHRcdFx0dGhpcy53YXJuaW5nQXJlYURlZ2VuLnNldFBvc2l0aW9uKHRoaXMub3JpZ2luLngsIHRoaXMub3JpZ2luLnkpO1xuXHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHRtYXAuYWRkUHJvamVjdGlsZSh0aGlzLmFyZWFEZWdlbik7XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLldBUk5JTkcpXG5cdFx0XHR0aGlzLndhcm5pbmdBcmVhRGVnZW4ucGFpbnQocGFpbnRlciwgY2FtZXJhLCB0cnVlKTtcblxuXHR9XG59XG5cbkFyZWFEZWdlbkxheWVyLlN0YWdlcyA9IFN0YWdlcztcblxubW9kdWxlLmV4cG9ydHMgPSBBcmVhRGVnZW5MYXllcjtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XHJcbmNvbnN0IHtjb3MsIHNpbn0gPSByZXF1aXJlKCcuLi8uLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi91dGlsL1ZlY3RvcicpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScpO1xyXG5cclxuY2xhc3MgQ2hhc2UgZXh0ZW5kcyBNb2R1bGUge1xyXG5cdGNvbmZpZyhvcmlnaW4sIHNwZWVkLCBkaXJNb2R1bGUpIHtcclxuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG5cdFx0dGhpcy5zcGVlZCA9IHNwZWVkO1xyXG5cdFx0dGhpcy5kaXJNb2R1bGUgPSBkaXJNb2R1bGVcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSlcclxuXHRcdFx0dGhpcy5vcmlnaW4uc2FmZU1vdmUoaW50ZXJzZWN0aW9uRmluZGVyLCB0aGlzLmRpck1vZHVsZS5kaXIueCwgdGhpcy5kaXJNb2R1bGUuZGlyLnksIHRoaXMuc3BlZWQpO1xyXG5cdH1cclxufVxyXG5cclxuLy8gdG9kbyBbbWVkaXVtXSBtYXliZSBjaGFzZSBjYW4gYmUgYSBtb2R1bGUgdXNlZCBpbiBhIG5lYXIvZmFyIG1vZHVsZSBtYW5hZ2VyXHJcblxyXG5DaGFzZS5TdGFnZXMgPSBTdGFnZXM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENoYXNlO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XHJcbmNvbnN0IFBoYXNlID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9QaGFzZScpO1xyXG5cclxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScsICdDT09MRE9XTicpO1xyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnVU5UUklHR0VSRUQnLCAnVFJJR0dFUkVEJyk7XHJcblxyXG5jbGFzcyBDb29sZG93biBleHRlbmRzIE1vZHVsZU1hbmFnZXIge1xyXG5cdGNvbmZpZyhkdXJhdGlvbikge1xyXG5cdFx0dGhpcy5jb29sZG93biA9IG5ldyBQaGFzZShkdXJhdGlvbiwgMCk7XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5JTkFDVElWRSlcclxuXHRcdFx0dGhpcy5jb29sZG93bi5zZXF1ZW50aWFsVGljaygpO1xyXG5cdFx0aWYgKHRoaXMuY29vbGRvd24uZ2V0KCkgPT09IDEgJiYgdGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSkge1xyXG5cdFx0XHR0aGlzLmNvb2xkb3duLnNldFBoYXNlKDApO1xyXG5cdFx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZShQaGFzZXMuVFJJR0dFUkVEKTtcclxuXHRcdH0gZWxzZVxyXG5cdFx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZShQaGFzZXMuVU5UUklHR0VSRUQpO1xyXG5cdH1cclxufVxyXG5cclxuQ29vbGRvd24uU3RhZ2VzID0gU3RhZ2VzO1xyXG5Db29sZG93bi5QaGFzZXMgPSBQaGFzZXM7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IENvb2xkb3duO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XHJcbmNvbnN0IHtzZXRNYWduaXR1ZGV9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuXHJcbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdBSU1JTkcnLCAnV0FSTklORycsICdEQVNISU5HJyk7XHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdBSU1JTkcnLCAnV0FSTklORycsICdEQVNISU5HJyk7XHJcblxyXG5jbGFzcyBEYXNoIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XHJcblx0Y29uZmlnKG9yaWdpbiwgZGlzdGFuY2UsIGRhc2hEdXJhdGlvbikge1xyXG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XHJcblx0XHR0aGlzLmRpc3RhbmNlID0gZGlzdGFuY2U7XHJcblx0XHR0aGlzLmRhc2hEdXJhdGlvbiA9IGRhc2hEdXJhdGlvbjtcclxuXHRcdHRoaXMudGFyZ2V0ID0ge307XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5EQVNISU5HKVxyXG5cdFx0XHR0aGlzLmNvbGxpZGVkID0gZmFsc2U7XHJcblxyXG5cdFx0Ly8gc3RhZ2Ugc2hvdWxkIGJlIGVxdWl2YWxlbnQgdG8gcGhhc2UgdW5sZXNzIHdlJ3ZlIGNvbGxpZGVkIHdoaWxlIGRhc2hpbmdcclxuXHRcdGlmICghdGhpcy5jb2xsaWRlZClcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UodGhpcy5zdGFnZSk7XHJcblxyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BSU1JTkcpIHtcclxuXHRcdFx0bGV0IGRlbHRhID0gc2V0TWFnbml0dWRlKHRhcmdldC54IC0gdGhpcy5vcmlnaW4ueCwgdGFyZ2V0LnkgLSB0aGlzLm9yaWdpbi55LCB0aGlzLmRpc3RhbmNlKTtcclxuXHRcdFx0dGhpcy50YXJnZXQueCA9IHRoaXMub3JpZ2luLnggKyBkZWx0YS54O1xyXG5cdFx0XHR0aGlzLnRhcmdldC55ID0gdGhpcy5vcmlnaW4ueSArIGRlbHRhLnk7XHJcblx0XHRcdHRoaXMuZGlyID0gc2V0TWFnbml0dWRlKGRlbHRhLngsIGRlbHRhLnkpO1xyXG5cclxuXHRcdH0gZWxzZSBpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkRBU0hJTkcgJiYgIXRoaXMuY29sbGlkZWQpIHtcclxuXHRcdFx0dGhpcy5jb2xsaWRlZCA9IHRoaXMub3JpZ2luLnNhZmVNb3ZlKGludGVyc2VjdGlvbkZpbmRlciwgdGhpcy5kaXIueCwgdGhpcy5kaXIueSwgdGhpcy5kaXN0YW5jZSAvIHRoaXMuZGFzaER1cmF0aW9uLCB0cnVlKS5yZWZlcmVuY2U7XHJcblx0XHRcdGlmICh0aGlzLmNvbGxpZGVkKSB7XHJcblx0XHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLklOQUNUSVZFKTtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC54ID0gdGhpcy5vcmlnaW4ueDtcclxuXHRcdFx0XHR0aGlzLnRhcmdldC55ID0gdGhpcy5vcmlnaW4ueTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuRGFzaC5TdGFnZXMgPSBTdGFnZXM7XHJcbkRhc2guUGhhc2VzID0gUGhhc2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEYXNoO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XHJcbmNvbnN0IHtnZXRNYWduaXR1ZGV9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuXHJcbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcclxuLy8gdmFyaWFibGUgbnVtYmVyIG9mIHBoYXNlcyBwZXIgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBjb25maWdcclxuXHJcbmNsYXNzIERpc3RhbmNlIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XHJcblx0Ly8gZGlzdGFuY2VzIHNob3VsZCBiZSBpbiBpbmNyZWFzaW5nIG9yZGVyXHJcblx0Ly8gaWYgdGhpcy5kaXN0YW5jZXMgPSBbMTAsIDIwXSwgdGhlbiBwaGFzZSAxID0gWzEwLCAyMClcclxuXHRjb25maWcob3JpZ2luLCAuLi5kaXN0YW5jZXMpIHtcclxuXHRcdHRoaXMub3JpZ2luID0gb3JpZ2luO1xyXG5cdFx0dGhpcy5kaXN0YW5jZXMgPSBkaXN0YW5jZXM7XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5BQ1RJVkUpXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgdGFyZ2V0RGlzdGFuY2UgPSBnZXRNYWduaXR1ZGUodGFyZ2V0LnggLSB0aGlzLm9yaWdpbi54LCB0YXJnZXQueSAtIHRoaXMub3JpZ2luLnkpO1xyXG5cclxuXHRcdGxldCBwaGFzZSA9IHRoaXMuZGlzdGFuY2VzLmZpbmRJbmRleChkaXN0YW5jZSA9PiB0YXJnZXREaXN0YW5jZSA8IGRpc3RhbmNlKTtcclxuXHRcdGlmIChwaGFzZSA9PT0gLTEpXHJcblx0XHRcdHBoYXNlID0gdGhpcy5kaXN0YW5jZXMubGVuZ3RoO1xyXG5cdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UocGhhc2UpO1xyXG5cdH1cclxufVxyXG5cclxuRGlzdGFuY2UuU3RhZ2VzID0gU3RhZ2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEaXN0YW5jZTtcclxuIiwiY2xhc3MgTW9kdWxlIHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHRoaXMuc3RhZ2UgPSAwO1xyXG5cdH1cclxuXHJcblx0Y29uZmlnKCkge1xyXG5cdH1cclxuXHJcblx0c2V0U3RhZ2Uoc3RhZ2UpIHtcclxuXHRcdGlmIChzdGFnZSAhPT0gdW5kZWZpbmVkKVxyXG5cdFx0XHR0aGlzLnN0YWdlID0gc3RhZ2VcclxuXHR9XHJcblxyXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdHRoaXMuYXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpO1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHR9XHJcblxyXG5cdHBhaW50KHBhaW50ZXIsIGNhbnZhcykge1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBNb2R1bGU7XHJcbiIsImNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XHJcblxyXG5jbGFzcyBNb2R1bGVNYW5hZ2VyIGV4dGVuZHMgTW9kdWxlIHtcclxuXHRjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0XHR0aGlzLm1vZHVsZXMgPSBbXTtcclxuXHRcdHRoaXMucGhhc2UgPSAtMTtcclxuXHR9XHJcblxyXG5cdGFkZE1vZHVsZShtb2R1bGUsIHN0YWdlc01hcCkge1xyXG5cdFx0dGhpcy5tb2R1bGVzLnB1c2goe21vZHVsZSwgc3RhZ2VzTWFwfSk7XHJcblx0fVxyXG5cclxuXHQvLyB0b2RvIFttZWRpdW1dIHJlbmFtZSB0byBzZXRQaGFzZVxyXG5cdG1vZHVsZXNTZXRTdGFnZShwaGFzZSkge1xyXG5cdFx0aWYgKHBoYXNlID09PSB0aGlzLnBoYXNlKVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHR0aGlzLnBoYXNlID0gcGhhc2U7XHJcblx0XHR0aGlzLm1vZHVsZXMuZm9yRWFjaCgoe21vZHVsZSwgc3RhZ2VzTWFwfSkgPT5cclxuXHRcdFx0bW9kdWxlLnNldFN0YWdlKHN0YWdlc01hcFtwaGFzZV0pKTtcclxuXHR9XHJcblxyXG5cdGFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdHRoaXMuYXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpO1xyXG5cdFx0dGhpcy5tb2R1bGVzLmZvckVhY2goKHttb2R1bGV9KSA9PlxyXG5cdFx0XHRtb2R1bGUuYXBwbHkobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkpO1xyXG5cdH1cclxuXHJcblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XHJcblx0XHR0aGlzLm1vZHVsZXMuZm9yRWFjaCgoe21vZHVsZX0pID0+XHJcblx0XHRcdG1vZHVsZS5wYWludChwYWludGVyLCBjYW1lcmEpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTW9kdWxlTWFuYWdlcjtcclxuXHJcbi8vIHRvZG8gW2xvd10gY29uc2lkZXIgbWVyZ2luZyBtb2R1bGVNYW5hZ2VyIGFuZCBtb2R1bGVcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XG5jb25zdCBBcmVhRGVnZW4gPSByZXF1aXJlKCcuLi9hdHRhY2svQXJlYURlZ2VuJyk7XG5cbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdXQVJOSU5HJywgJ0FDVElWRScsICdJTkFDVElWRScpO1xuXG5jbGFzcyBOZWFyYnlEZWdlbiBleHRlbmRzIE1vZHVsZSB7XG5cdGNvbmZpZyhvcmlnaW4sIHJhbmdlLCBkYW1hZ2UpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLmFyZWFEZWdlbiA9IG5ldyBBcmVhRGVnZW4ob3JpZ2luLngsIG9yaWdpbi55LCByYW5nZSwgLTEsIGRhbWFnZSwgZmFsc2UpO1xuXHR9XG5cblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcblx0XHRpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLklOQUNUSVZFKVxuXHRcdFx0dGhpcy5hcmVhRGVnZW4uc2V0UG9zaXRpb24odGhpcy5vcmlnaW4ueCwgdGhpcy5vcmlnaW4ueSk7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5BQ1RJVkUpXG5cdFx0XHR0aGlzLmFyZWFEZWdlbi51cGRhdGUobWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0aWYgKHRoaXMuc3RhZ2UgIT09IFN0YWdlcy5JTkFDVElWRSlcblx0XHRcdHRoaXMuYXJlYURlZ2VuLnBhaW50KHBhaW50ZXIsIGNhbWVyYSwgdGhpcy5zdGFnZSA9PT0gU3RhZ2VzLldBUk5JTkcpO1xuXG5cdH1cbn1cblxuTmVhcmJ5RGVnZW4uU3RhZ2VzID0gU3RhZ2VzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5lYXJieURlZ2VuO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9kdWxlTWFuYWdlciA9IHJlcXVpcmUoJy4vTW9kdWxlTWFuYWdlcicpO1xyXG5cclxuY29uc3QgUHJpbWFyeVN0YWdlcyA9IG1ha2VFbnVtKCdQTEFZJywgJ0xPT1AnLCAnUEFVU0UnLCAnU1RPUCcpO1xyXG4vLyB2YXJpYWJsZSBudW1iZXIgb2Ygc2Vjb25kYXJ5IHN0YWdlcyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHBhdHRlcm5zIGRlZmluZWRcclxuLy8gdmFyaWFibGUgbnVtYmVyIG9mIHBoYXNlcyBkZXBlbmRpbmcgb24gbnVtYmVyIG9mIHBlcmlvZHMgZGVmaW5lZFxyXG5cclxuY2xhc3MgcGF0dGVybmVkUGVyaW9kIGV4dGVuZHMgTW9kdWxlTWFuYWdlciB7XHJcblx0Y29uZmlnKHBlcmlvZHMsIHBhdHRlcm5zLCBxdWV1ZXMpIHtcclxuXHRcdHRoaXMucGVyaW9kcyA9IHBlcmlvZHM7XHJcblx0XHR0aGlzLnBhdHRlcm5zID0gcGF0dGVybnM7XHJcblx0XHQvLyBXaGVuIHNlY29uZGFyeVN0YWdlIGlzIHNldCB0byBpLFxyXG5cdFx0Ly8gaWYgcXVldWVzW2ldIGlzIHRydWUsIHdpbGwgbm90IHVwZGF0ZSBjdXJQYXR0ZXJuSSB0byBpIHVudGlsIGFmdGVyIGN1clBhdHRlcm5JIGNvbXBsZXRlc1xyXG5cdFx0Ly8gZWxzZSBpZiBxdWV1ZXNbaV0gaXMgZmFsc2UsIHdpbGwgdXBkYXRlIGN1clBhdHRlcm5JIHRvIGkgaW1tZWRpYXRlbHkuXHJcblx0XHR0aGlzLnF1ZXVlcyA9IHF1ZXVlcztcclxuXHRcdHRoaXMuc2V0Q3VyUGF0dGVybigwKTtcclxuXHR9XHJcblxyXG5cdHNldEN1clBhdHRlcm4ocGF0dGVybkkpIHtcclxuXHRcdHRoaXMuY3VyUGF0dGVybkkgPSBwYXR0ZXJuSTtcclxuXHRcdHRoaXMuY3VyUGVyaW9kSSA9IDA7XHJcblx0XHR0aGlzLnJlc2V0RHVyYXRpb24oKTtcclxuXHR9XHJcblxyXG5cdGdldCBwZXJpb2QoKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5wYXR0ZXJuc1t0aGlzLmN1clBhdHRlcm5JXVt0aGlzLmN1clBlcmlvZEldO1xyXG5cdH1cclxuXHJcblx0cmVzZXREdXJhdGlvbigpIHtcclxuXHRcdHRoaXMuY3VyRHVyYXRpb24gPSB0aGlzLnBlcmlvZHNbdGhpcy5wZXJpb2RdO1xyXG5cdFx0aWYgKHRoaXMuY3VyRHVyYXRpb24pXHJcblx0XHRcdHRoaXMuY3VyRHVyYXRpb24rKztcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZVswXSA9PT0gUHJpbWFyeVN0YWdlcy5TVE9QKVxyXG5cdFx0XHR0aGlzLnNldEN1clBhdHRlcm4oMCk7XHJcblxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGFnZVswXSAhPT0gUHJpbWFyeVN0YWdlcy5QQVVTRSkge1xyXG5cdFx0XHRpZiAodGhpcy5zdGFnZVsxXSAhPT0gdGhpcy5jdXJQYXR0ZXJuSSAmJiAoIXRoaXMucXVldWVzW3RoaXMuc3RhZ2VbMV1dIHx8ICF0aGlzLmN1ckR1cmF0aW9uKSlcclxuXHRcdFx0XHR0aGlzLnNldEN1clBhdHRlcm4odGhpcy5zdGFnZVsxXSk7XHJcblx0XHRcdGlmICh0aGlzLmN1ckR1cmF0aW9uICYmICEtLXRoaXMuY3VyRHVyYXRpb24pIHtcclxuXHRcdFx0XHRpZiAodGhpcy5jdXJQZXJpb2RJIDwgdGhpcy5wYXR0ZXJuc1t0aGlzLmN1clBhdHRlcm5JXS5sZW5ndGggLSAxKVxyXG5cdFx0XHRcdFx0dGhpcy5jdXJQZXJpb2RJKys7XHJcblx0XHRcdFx0ZWxzZSBpZiAodGhpcy5zdGFnZVsxXSAhPT0gdGhpcy5jdXJQYXR0ZXJuSSlcclxuXHRcdFx0XHRcdHRoaXMuc2V0Q3VyUGF0dGVybih0aGlzLnN0YWdlWzFdKTtcclxuXHRcdFx0XHRlbHNlIGlmICh0aGlzLnN0YWdlWzBdID09PSBQcmltYXJ5U3RhZ2VzLkxPT1ApXHJcblx0XHRcdFx0XHR0aGlzLmN1clBlcmlvZEkgPSAwO1xyXG5cdFx0XHRcdHRoaXMucmVzZXREdXJhdGlvbigpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UodGhpcy5wZXJpb2QpO1xyXG5cdH1cclxufVxyXG5cclxucGF0dGVybmVkUGVyaW9kLlByaW1hcnlTdGFnZXMgPSBQcmltYXJ5U3RhZ2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBwYXR0ZXJuZWRQZXJpb2Q7XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vZHVsZU1hbmFnZXIgPSByZXF1aXJlKCcuL01vZHVsZU1hbmFnZXInKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi91dGlsL1BoYXNlJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnUExBWScsICdMT09QJywgJ1BBVVNFJywgJ1NUT1AnKTtcclxuLy8gdmFyaWFibGUgbnVtYmVyIG9mIHBoYXNlcyBwZXIgbnVtYmVyIG9mIGFyZ3VtZW50cyB0byBjb25maWdcclxuXHJcbmNsYXNzIFBlcmlvZCBleHRlbmRzIE1vZHVsZU1hbmFnZXIge1xyXG5cdGNvbmZpZyguLi5wZXJpb2RzKSB7XHJcblx0XHR0aGlzLnBlcmlvZENvdW50ID0gcGVyaW9kcy5sZW5ndGg7XHJcblx0XHR0aGlzLnBlcmlvZHMgPSBuZXcgUGhhc2UoLi4ucGVyaW9kcywgMCk7XHJcblx0fVxyXG5cclxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xyXG5cdFx0aWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5TVE9QKVxyXG5cdFx0XHR0aGlzLnBlcmlvZHMuc2V0UGhhc2UoMCk7XHJcblxyXG5cdFx0ZWxzZSBpZiAodGhpcy5zdGFnZSAhPT0gU3RhZ2VzLlBBVVNFKSB7XHJcblx0XHRcdHRoaXMucGVyaW9kcy5zZXF1ZW50aWFsVGljaygpO1xyXG5cdFx0XHRpZiAodGhpcy5wZXJpb2RzLmdldCgpID09PSB0aGlzLnBlcmlvZENvdW50ICYmIHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5MT09QKVxyXG5cdFx0XHRcdHRoaXMucGVyaW9kcy5zZXRQaGFzZSgwKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZSh0aGlzLnBlcmlvZHMuZ2V0KCkpO1xyXG5cdH1cclxufVxyXG5cclxuUGVyaW9kLlN0YWdlcyA9IFN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUGVyaW9kO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGUgPSByZXF1aXJlKCcuL01vZHVsZScpO1xyXG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi8uLi91dGlsL1ZlY3RvcicpO1xyXG5jb25zdCB7Y29zLCBzaW59ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcclxuXHJcbmNvbnN0IFN0YWdlcyA9IG1ha2VFbnVtKCdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcclxuXHJcbmNsYXNzIFBvc2l0aW9uIGV4dGVuZHMgTW9kdWxlIHtcclxuXHRjb25maWcob3JpZ2luID0gbnVsbCwgcmFuZE1pbk1hZyA9IDAsIHJhbmRNYXhNYWcgPSAwKSB7XHJcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjsgLy8gaWYgbnVsbCwgd2lsbCB1c2UgdGFyZ2V0XHJcblx0XHR0aGlzLnJhbmRNaW5NYWcgPSByYW5kTWluTWFnO1xyXG5cdFx0dGhpcy5yYW5kTWF4TWFnID0gcmFuZE1heE1hZztcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSlcclxuXHRcdFx0KHt4OiB0aGlzLngsIHk6IHRoaXMueX0gPVxyXG5cdFx0XHRcdFZlY3Rvci5mcm9tT2JqKHRoaXMub3JpZ2luIHx8IHRhcmdldCkuYWRkKFZlY3Rvci5mcm9tUmFuZCh0aGlzLnJhbmRNaW5NYWcsIHRoaXMucmFuZE1heE1hZykpKTtcclxuXHR9XHJcbn1cclxuXHJcblBvc2l0aW9uLlN0YWdlcyA9IFN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9zaXRpb247XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vZHVsZSA9IHJlcXVpcmUoJy4vTW9kdWxlJyk7XHJcbmNvbnN0IFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvVmVjdG9yJyk7XHJcbmNvbnN0IHt0aGV0YVRvVmVjdG9yfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnQUNUSVZFJywgJ0lOQUNUSVZFJyk7XHJcblxyXG5jbGFzcyBSb3RhdGUgZXh0ZW5kcyBNb2R1bGUge1xyXG5cdGNvbmZpZyhvcmlnaW4sIHJhdGUgPSAxIC8gNTAsIHRoZXRhID0gMCwgYXRUYXJnZXQgPSBmYWxzZSkge1xyXG5cdFx0dGhpcy5vcmlnaW4gPSBvcmlnaW47XHJcblx0XHR0aGlzLnJhdGUgPSByYXRlO1xyXG5cdFx0dGhpcy50aGV0YSA9IHRoZXRhO1xyXG5cdFx0dGhpcy5hdFRhcmdldCA9IGF0VGFyZ2V0O1xyXG5cdH1cclxuXHJcblx0YXBwbHlfKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCB0YXJnZXQpIHtcclxuXHRcdGlmICh0aGlzLnN0YWdlID09PSBTdGFnZXMuSU5BQ1RJVkUpXHJcblx0XHRcdHJldHVybjtcclxuXHRcdGlmICh0aGlzLmF0VGFyZ2V0KSB7XHJcblx0XHRcdGxldCBkZWx0YSA9IFZlY3Rvci5mcm9tT2JqKHRhcmdldCkuc3VidHJhY3QoVmVjdG9yLmZyb21PYmoodGhpcy5vcmlnaW4pKTtcclxuXHRcdFx0dGhpcy5vcmlnaW4uc2V0TW92ZURpcmVjdGlvbihkZWx0YS54LCBkZWx0YS55KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHRoaXMudGhldGEgKz0gdGhpcy5yYXRlO1xyXG5cdFx0XHR0aGlzLm9yaWdpbi5zZXRNb3ZlRGlyZWN0aW9uKC4uLnRoZXRhVG9WZWN0b3IodGhpcy50aGV0YSkpO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuUm90YXRlLlN0YWdlcyA9IFN0YWdlcztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUm90YXRlO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcbmNvbnN0IHtyYW5kLCByYW5kVmVjdG9yfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBQcm9qZWN0aWxlID0gcmVxdWlyZSgnLi4vYXR0YWNrL1Byb2plY3RpbGUnKTtcblxuY29uc3QgU3RhZ2VzID0gbWFrZUVudW0oJ0FDVElWRScsICdJTkFDVElWRScpO1xuXG5jbGFzcyBTaG90Z3VuIGV4dGVuZHMgTW9kdWxlIHtcblx0Y29uZmlnKG9yaWdpbiwgcmF0ZSwgY291bnQsIHZlbG9jaXR5LCBzcHJlYWQsIGR1cmF0aW9uLCBkYW1hZ2UsIGRpck1vZHVsZSwgcHJlZGljdGFibGVSYXRlID0gZmFsc2UsIHNpemUgPSAuMDIpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnJhdGUgPSByYXRlO1xuXHRcdHRoaXMuY291bnQgPSBjb3VudDtcblx0XHR0aGlzLnZlbG9jaXR5ID0gdmVsb2NpdHk7XG5cdFx0dGhpcy5zcHJlYWQgPSBzcHJlYWQ7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdHRoaXMuZGFtYWdlID0gZGFtYWdlO1xuXHRcdHRoaXMuZGlyTW9kdWxlID0gZGlyTW9kdWxlO1xuXHRcdHRoaXMucHJlZGljdGFibGVSYXRlID0gcHJlZGljdGFibGVSYXRlO1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5yYXRlQ3VycmVudCA9IDA7XG5cdH1cblxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuQUNUSVZFKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGlmICghdGhpcy5wcmVkaWN0YWJsZVJhdGUgJiYgcmFuZCgpID4gdGhpcy5yYXRlKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGlmICh0aGlzLnByZWRpY3RhYmxlUmF0ZSAmJiAodGhpcy5yYXRlQ3VycmVudCArPSB0aGlzLnJhdGUpIDwgMSlcblx0XHRcdHJldHVybjtcblx0XHR0aGlzLnJhdGVDdXJyZW50LS07XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY291bnQ7IGkrKykge1xuXHRcdFx0bGV0IGRpcmVjdHYgPSB0aGlzLmRpck1vZHVsZS5kaXIuY29weTtcblx0XHRcdGRpcmVjdHYubWFnbml0dWRlID0gdGhpcy52ZWxvY2l0eTtcblx0XHRcdGxldCByYW5kdiA9IHJhbmRWZWN0b3IodGhpcy5zcHJlYWQpO1xuXG5cdFx0XHRsZXQgcHJvamVjdGlsZSA9IG5ldyBQcm9qZWN0aWxlKFxuXHRcdFx0XHR0aGlzLm9yaWdpbi54LCB0aGlzLm9yaWdpbi55LFxuXHRcdFx0XHR0aGlzLnNpemUsIHRoaXMuc2l6ZSxcblx0XHRcdFx0ZGlyZWN0di54ICsgcmFuZHZbMF0sIGRpcmVjdHYueSArIHJhbmR2WzFdLFxuXHRcdFx0XHR0aGlzLmR1cmF0aW9uLCB0aGlzLmRhbWFnZSwgZmFsc2UpO1xuXHRcdFx0bWFwLmFkZFByb2plY3RpbGUocHJvamVjdGlsZSk7XG5cdFx0fVxuXHR9XG59XG5cblNob3RndW4uU3RhZ2VzID0gU3RhZ2VzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNob3RndW47XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xuY29uc3QgTW9kdWxlID0gcmVxdWlyZSgnLi9Nb2R1bGUnKTtcbmNvbnN0IFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvVmVjdG9yJyk7XG5jb25zdCBMYXNlciA9IHJlcXVpcmUoJy4uL2F0dGFjay9MYXNlcicpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgTGluZSA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvTGluZScpO1xuXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnV0FSTklORycsICdBQ1RJVkUnLCAnSU5BQ1RJVkUnKTtcblxuY2xhc3MgU3RhdGljTGFzZXIgZXh0ZW5kcyBNb2R1bGUge1xuXHRjb25maWcob3JpZ2luLCBzcHJlYWQsIHJhbmdlLCBkaXJNb2R1bGUsIGR1cmF0aW9uLCBkYW1hZ2UsIHNpemUgPSAuMDIpIHtcblx0XHR0aGlzLm9yaWdpbiA9IG9yaWdpbjtcblx0XHR0aGlzLnNwcmVhZCA9IHNwcmVhZDtcblx0XHR0aGlzLnJhbmdlID0gcmFuZ2U7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdHRoaXMuZGFtYWdlID0gZGFtYWdlO1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5kaXJNb2R1bGUgPSBkaXJNb2R1bGU7XG5cdH1cblxuXHRhcHBseV8obWFwLCBpbnRlcnNlY3Rpb25GaW5kZXIsIHRhcmdldCkge1xuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuQUNUSVZFKVxuXHRcdFx0cmV0dXJuO1xuXG5cdFx0bGV0IGRpciA9IFZlY3Rvci5mcm9tUmFuZCh0aGlzLnNwcmVhZCkuYWRkKHRoaXMuZGlyTW9kdWxlLmRpcik7XG5cblx0XHRsZXQgbGFzZXIgPSBuZXcgTGFzZXIoXG5cdFx0XHR0aGlzLm9yaWdpbi54LCB0aGlzLm9yaWdpbi55LFxuXHRcdFx0ZGlyLngsIGRpci55LFxuXHRcdFx0dGhpcy5zaXplLCB0aGlzLmR1cmF0aW9uLCB0aGlzLmRhbWFnZSwgZmFsc2UpO1xuXHRcdG1hcC5hZGRQcm9qZWN0aWxlKGxhc2VyKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdGlmICh0aGlzLnN0YWdlICE9PSBTdGFnZXMuV0FSTklORylcblx0XHRcdHJldHVybjtcblx0XHRsZXQgd2FybmluZyA9IFZlY3Rvci5mcm9tT2JqKHRoaXMub3JpZ2luKS5hZGQodGhpcy5kaXJNb2R1bGUuZGlyKTtcblx0XHRwYWludGVyLmFkZChMaW5lLndpdGhDYW1lcmEoXG5cdFx0XHRjYW1lcmEsXG5cdFx0XHR0aGlzLm9yaWdpbi54LCB0aGlzLm9yaWdpbi55LFxuXHRcdFx0d2FybmluZy54LCB3YXJuaW5nLnksXG5cdFx0XHR0aGlzLnNpemUsXG5cdFx0XHR7Y29sb3I6IENvbG9ycy5FbnRpdHkuQVJFQV9ERUdFTi5XQVJOSU5HX0JPUkRFUi5nZXQoKX0pKTtcblx0fVxufVxuXG5TdGF0aWNMYXNlci5TdGFnZXMgPSBTdGFnZXM7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhdGljTGFzZXI7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi9Nb2R1bGVNYW5hZ2VyJyk7XHJcblxyXG5jb25zdCBTdGFnZXMgPSBtYWtlRW51bSgnSU5BQ1RJVkUnLCAnQUNUSVZFJyk7XHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdJTkFDVElWRScsICdVTlRSSUdHRVJFRCcsICdUUklHR0VSRUQnKTtcclxuXHJcbmNsYXNzIFRyaWdnZXIgZXh0ZW5kcyBNb2R1bGVNYW5hZ2VyIHtcclxuXHRjb25maWcoZHVyYXRpb24pIHtcclxuXHRcdHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuXHR9XHJcblxyXG5cdGFwcGx5XyhtYXAsIGludGVyc2VjdGlvbkZpbmRlciwgdGFyZ2V0KSB7XHJcblx0XHRpZiAodGhpcy5zdGFnZSA9PT0gU3RhZ2VzLkFDVElWRSAmJiB0aGlzLmxhc3RTdGFnZSAhPT0gdGhpcy5zdGFnZSkge1xyXG5cdFx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZShQaGFzZXMuVFJJR0dFUkVEKTtcclxuXHRcdFx0dGhpcy5jdXJyZW50RHVyYXRpb24gPSB0aGlzLmR1cmF0aW9uO1xyXG5cdFx0fSBlbHNlIGlmICh0aGlzLmN1cnJlbnREdXJhdGlvbilcclxuXHRcdFx0dGhpcy5jdXJyZW50RHVyYXRpb24tLTtcclxuXHRcdGVsc2UgaWYgKHRoaXMuc3RhZ2UgPT09IFN0YWdlcy5JTkFDVElWRSlcclxuXHRcdFx0dGhpcy5tb2R1bGVzU2V0U3RhZ2UoUGhhc2VzLklOQUNUSVZFKTtcclxuXHRcdGVsc2UgaWYgKHRoaXMubGFzdFN0YWdlID09PSB0aGlzLnN0YWdlKVxyXG5cdFx0XHR0aGlzLm1vZHVsZXNTZXRTdGFnZShQaGFzZXMuVU5UUklHR0VSRUQpO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHRjb25zb2xlLmVycm9yKCdpbXBvc3NpYmxlIGJyYW5jaCByZWFjaGVkLicpO1xyXG5cdFx0dGhpcy5sYXN0U3RhZ2UgPSB0aGlzLnN0YWdlO1xyXG5cdH1cclxufVxyXG5cclxuVHJpZ2dlci5TdGFnZXMgPSBTdGFnZXM7XHJcblRyaWdnZXIuUGhhc2VzID0gUGhhc2VzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmlnZ2VyO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgV1NoaXAgPSByZXF1aXJlKCcuLi8uLi9ncmFwaGljcy9XU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3QgUGVyaW9kID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9QZXJpb2QnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9BaW0nKTtcclxuY29uc3QgQ2hhc2UgPSByZXF1aXJlKCcuLi9tb2R1bGVzL0NoYXNlJyk7XHJcbmNvbnN0IFNob3RndW4gPSByZXF1aXJlKCcuLi9tb2R1bGVzL1Nob3RndW4nKTtcclxuY29uc3QgRGFzaCA9IHJlcXVpcmUoJy4uL21vZHVsZXMvRGFzaCcpO1xyXG5jb25zdCBUcmlnZ2VyID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9UcmlnZ2VyJyk7XHJcbmNvbnN0IE5lYXJieURlZ2VuID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9OZWFyYnlEZWdlbicpO1xyXG4vLyBjb25zdCBCb29tZXJhbmcgPSByZXF1aXJlKCcuLi9tb2R1bGVzL0Jvb21lcmFuZycpO1xyXG5cclxuY29uc3QgUGhhc2VzID0gbWFrZUVudW0oJ09ORScpO1xyXG5cclxuY2xhc3MgQ2hhbXBpb24gZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDUsIC4wNSwgMSk7XHJcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBXU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgcGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0cGVyaW9kLmNvbmZpZygxMDAsIDI1LCAyNSwgMzApO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZShwZXJpb2QsIHtbUGhhc2VzLk9ORV06IFBlcmlvZC5TdGFnZXMuTE9PUCx9KTtcclxuXHJcblx0XHRsZXQgY2hhc2VBaW0gPSBuZXcgQWltKCk7XHJcblx0XHRjaGFzZUFpbS5jb25maWcodGhpcyk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGNoYXNlQWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZSA9IG5ldyBDaGFzZSgpO1xyXG5cdFx0Y2hhc2UuY29uZmlnKHRoaXMsIC4wMDUsIGFpbSk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGNoYXNlLCB7XHJcblx0XHRcdDA6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IHNob3RndW5BaW0gPSBuZXcgQWltKCk7XHJcblx0XHRzaG90Z3VuQWltLmNvbmZpZyh0aGlzKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoc2hvdGd1bkFpbSwge1xyXG5cdFx0XHQwOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MTogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgc2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XHJcblx0XHRzaG90Z3VuLmNvbmZpZyh0aGlzLCAuMDMsIDEsIC4wMSwgLjAwMSwgNTAsIC4wMiwgc2hvdGd1bkFpbSk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKHNob3RndW4sIHtcclxuXHRcdFx0MDogU2hvdGd1bi5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBkYXNoID0gbmV3IERhc2goKTtcclxuXHRcdGRhc2guY29uZmlnKHRoaXMsIC40LCAzMCk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGRhc2gsIHtcclxuXHRcdFx0MDogRGFzaC5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IERhc2guU3RhZ2VzLkFJTUlORyxcclxuXHRcdFx0MjogRGFzaC5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0MzogRGFzaC5TdGFnZXMuREFTSElORyxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCB0cmlnZ2VyRGFzaEVuZCA9IG5ldyBUcmlnZ2VyKCk7XHJcblx0XHR0cmlnZ2VyRGFzaEVuZC5jb25maWcoMjApO1xyXG5cdFx0ZGFzaC5hZGRNb2R1bGUodHJpZ2dlckRhc2hFbmQsIHtcclxuXHRcdFx0W0Rhc2guUGhhc2VzLklOQUNUSVZFXTogVHJpZ2dlci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHRbRGFzaC5QaGFzZXMuQUlNSU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5XQVJOSU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5EQVNISU5HXTogVHJpZ2dlci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgZGFzaEF0dGFja1RhcmdldCA9IG5ldyBOZWFyYnlEZWdlbigpO1xyXG5cdFx0ZGFzaEF0dGFja1RhcmdldC5jb25maWcoZGFzaC50YXJnZXQsIC4xLCAuMDAyKTtcclxuXHRcdHRyaWdnZXJEYXNoRW5kLmFkZE1vZHVsZShkYXNoQXR0YWNrVGFyZ2V0LCB7XHJcblx0XHRcdFtUcmlnZ2VyLlBoYXNlcy5VTlRSSUdHRVJFRF06IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W1RyaWdnZXIuUGhhc2VzLlRSSUdHRVJFRF06IE5lYXJieURlZ2VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHRcdGRhc2guYWRkTW9kdWxlKGRhc2hBdHRhY2tUYXJnZXQsIHtcclxuXHRcdFx0W0Rhc2guUGhhc2VzLklOQUNUSVZFXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRbRGFzaC5QaGFzZXMuQUlNSU5HXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5XQVJOSU5HXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDaGFtcGlvbjtcclxuIiwiY29uc3QgTGl2aW5nRW50aXR5ID0gcmVxdWlyZSgnLi4vTGl2aW5nRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCBNb2R1bGVNYW5hZ2VyID0gcmVxdWlyZSgnLi4vbW9kdWxlcy9Nb2R1bGVNYW5hZ2VyJyk7XG5jb25zdCB7Q29sb3JzLCBQb3NpdGlvbnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IEJhckMgPSByZXF1aXJlKCcuLi8uLi9wYWludGVyL0JhckMnKTtcbmNvbnN0IEJhciA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvQmFyJyk7XG5cbmNsYXNzIE1vbnN0ZXIgZXh0ZW5kcyBMaXZpbmdFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBoZWFsdGgpIHtcblx0XHRzdXBlcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBoZWFsdGgsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSE9TVElMRV9VTklUKTtcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIgPSBuZXcgTW9kdWxlTWFuYWdlcigpO1xuXHR9XG5cblx0dXBkYXRlKG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSB7XG5cdFx0dGhpcy5yZWZyZXNoKCk7XG5cdFx0aWYgKHRoaXMuYXR0YWNrUGhhc2Uuc2VxdWVudGlhbFRpY2soKSlcblx0XHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFwcGx5KG1hcCwgaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlLmdldFBsYXllcigpKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHN1cGVyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSk7XG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSk7XG5cdFx0cGFpbnRlci5hZGQoQmFyQy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnkgLSB0aGlzLmhlaWdodCwgLjEsIC4wMSwgdGhpcy5oZWFsdGguZ2V0UmF0aW8oKSxcblx0XHRcdENvbG9ycy5MSUZFLmdldFNoYWRlKENvbG9ycy5CQVJfU0hBRElORyksIENvbG9ycy5MSUZFLmdldCgpLCBDb2xvcnMuTElGRS5nZXQoKSkpO1xuXHR9XG5cblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChuZXcgQmFyKFxuXHRcdFx0UG9zaXRpb25zLk1BUkdJTixcblx0XHRcdFBvc2l0aW9ucy5NQVJHSU4sXG5cdFx0XHQxIC0gUG9zaXRpb25zLk1BUkdJTiAqIDIsXG5cdFx0XHRQb3NpdGlvbnMuQkFSX0hFSUdIVCxcblx0XHRcdHRoaXMuaGVhbHRoLmdldFJhdGlvKCksXG5cdFx0XHRDb2xvcnMuTElGRS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpLFxuXHRcdFx0Q29sb3JzLkxJRkUuZ2V0KCksXG5cdFx0XHRDb2xvcnMuTElGRS5nZXRTaGFkZShDb2xvcnMuQkFSX1NIQURJTkcpKSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb25zdGVyO1xuIiwiY2xhc3MgTW9uc3Rlcktub3dsZWRnZSB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHR9XG5cblx0c2V0UGxheWVyKHBsYXllcikge1xuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHR9XG5cblx0Z2V0UGxheWVyKHBsYXllcikge1xuXHRcdHJldHVybiB0aGlzLnBsYXllcjtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vbnN0ZXJLbm93bGVkZ2U7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgUmVjdDFEb3RzU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL1JlY3QxRG90c1NoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvUGVyaW9kJyk7XHJcbmNvbnN0IFJvdGF0ZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvUm90YXRlJyk7XHJcbmNvbnN0IEFpbSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQWltJyk7XHJcbmNvbnN0IFN0YXRpY0xhc2VyID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9TdGF0aWNMYXNlcicpO1xyXG5cclxuY29uc3QgUGhhc2VzID0gbWFrZUVudW0oJ09ORScpO1xyXG5cclxuY2xhc3MgQWltaW5nTGFzZXJUdXJyZXQgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDksIC4wOSwgMS42KTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFJlY3QxRG90c1NoaXAodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKSkpO1xyXG5cclxuXHRcdHRoaXMuYXR0YWNrUGhhc2UgPSBuZXcgUGhhc2UoMCk7XHJcblxyXG5cdFx0bGV0IHBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdHBlcmlvZC5jb25maWcoNTAsIDcwLCA4MCwgMSk7XHJcblx0XHRwZXJpb2QucGVyaW9kcy5zZXRSYW5kb21UaWNrKCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHBlcmlvZCwge1tQaGFzZXMuT05FXTogUGVyaW9kLlN0YWdlcy5MT09QfSk7XHJcblxyXG5cdFx0bGV0IHJvdGF0ZSA9IG5ldyBSb3RhdGUoKTtcclxuXHRcdHJvdGF0ZS5jb25maWcodGhpcywgMCwgMCwgdHJ1ZSk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKHJvdGF0ZSwge1xyXG5cdFx0XHQwOiBSb3RhdGUuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBSb3RhdGUuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogUm90YXRlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogUm90YXRlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBhaW0gPSBuZXcgQWltKCk7XHJcblx0XHRhaW0uY29uZmlnKHRoaXMsIDApO1xyXG5cdFx0cGVyaW9kLmFkZE1vZHVsZShhaW0sIHtcclxuXHRcdFx0MDogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgc3RhdGljTGFzZXIgPSBuZXcgU3RhdGljTGFzZXIoKTtcclxuXHRcdHN0YXRpY0xhc2VyLmNvbmZpZyh0aGlzLCAuMDA1LCAuNSwgYWltLCA1MCwgLjAwNSk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKHN0YXRpY0xhc2VyLCB7XHJcblx0XHRcdDA6IFN0YXRpY0xhc2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogU3RhdGljTGFzZXIuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQyOiBTdGF0aWNMYXNlci5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0MzogU3RhdGljTGFzZXIuU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEFpbWluZ0xhc2VyVHVycmV0O1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgRG91YmxlSG9yaXpEaWFtb25kU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL0RvdWJsZUhvcml6RGlhbW9uZFNoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IHtQSX0gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBEaXN0YW5jZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvRGlzdGFuY2UnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9BaW0nKTtcclxuY29uc3QgQ2hhc2UgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0NoYXNlJyk7XHJcbmNvbnN0IENvb2xkb3duID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9Db29sZG93bicpO1xyXG5jb25zdCBBcmVhRGVnZW5MYXllciA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQXJlYURlZ2VuTGF5ZXInKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIEJvbWJMYXllciBleHRlbmRzIE1vbnN0ZXIge1xyXG5cdGNvbnN0cnVjdG9yKHgsIHkpIHtcclxuXHRcdHN1cGVyKHgsIHksIC4wNCwgLjA0LCAxLjIpO1xyXG5cdFx0dGhpcy5zZXRHcmFwaGljcyhuZXcgRG91YmxlSG9yaXpEaWFtb25kU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgZGlzdGFuY2UgPSBuZXcgRGlzdGFuY2UoKTtcclxuXHRcdGRpc3RhbmNlLmNvbmZpZyh0aGlzLCAuMSwgMSk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKGRpc3RhbmNlLCB7W1BoYXNlcy5PTkVdOiBEaXN0YW5jZS5TdGFnZXMuQUNUSVZFfSk7XHJcblxyXG5cdFx0bGV0IGFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGFpbS5jb25maWcodGhpcywgUEkgLyA4MCwgODAsIC4yKTtcclxuXHRcdGRpc3RhbmNlLmFkZE1vZHVsZShhaW0sIHtcclxuXHRcdFx0MDogQWltLlN0YWdlcy5SRVZFUlNFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZSA9IG5ldyBDaGFzZSgpO1xyXG5cdFx0Y2hhc2UuY29uZmlnKHRoaXMsIC4wMDMsIGFpbSk7XHJcblx0XHRkaXN0YW5jZS5hZGRNb2R1bGUoY2hhc2UsIHtcclxuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MTogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MjogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNvb2xkb3duID0gbmV3IENvb2xkb3duKCk7XHJcblx0XHRjb29sZG93bi5jb25maWcoODApO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKGNvb2xkb3duLCB7XHJcblx0XHRcdDA6IENvb2xkb3duLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENvb2xkb3duLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IENvb2xkb3duLlN0YWdlcy5DT09MRE9XTixcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBhcmVhRGVnZW4gPSBuZXcgQXJlYURlZ2VuTGF5ZXIoKTtcclxuXHRcdGFyZWFEZWdlbi5jb25maWcodGhpcywgLjEsIDIwMCwgLjAwMyk7XHJcblx0XHRjb29sZG93bi5hZGRNb2R1bGUoYXJlYURlZ2VuLCB7XHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVU5UUklHR0VSRURdOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVFJJR0dFUkVEXTogQXJlYURlZ2VuTGF5ZXIuU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvbWJMYXllcjtcclxuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0VudW0nKTtcclxuY29uc3QgTW9uc3RlciA9IHJlcXVpcmUoJy4uLy4vTW9uc3RlcicpO1xyXG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IEhleGFnb25TaGlwID0gcmVxdWlyZSgnLi4vLi4vLi4vZ3JhcGhpY3MvSGV4YWdvblNoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IHtQSX0gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBEaXN0YW5jZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvRGlzdGFuY2UnKTtcclxuY29uc3QgUGVyaW9kID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9QZXJpb2QnKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9BaW0nKTtcclxuY29uc3QgQ2hhc2UgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0NoYXNlJyk7XHJcbmNvbnN0IERhc2ggPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0Rhc2gnKTtcclxuY29uc3QgVHJpZ2dlciA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvVHJpZ2dlcicpO1xyXG5jb25zdCBOZWFyYnlEZWdlbiA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvTmVhcmJ5RGVnZW4nKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIERhc2hDaGFzZXIgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDYsIC4wNiwgMS4yKTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IEhleGFnb25TaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKX0pKTtcclxuXHJcblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xyXG5cclxuXHRcdGxldCBkaXN0YW5jZSA9IG5ldyBEaXN0YW5jZSgpO1xyXG5cdFx0ZGlzdGFuY2UuY29uZmlnKHRoaXMsIC44LCAxKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUoZGlzdGFuY2UsIHtbUGhhc2VzLk9ORV06IERpc3RhbmNlLlN0YWdlcy5BQ1RJVkV9KTtcclxuXHJcblx0XHRsZXQgcGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0cGVyaW9kLmNvbmZpZygxMjUsIDM1LCAxNSwgMjAsIDEpO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKHBlcmlvZCwge1xyXG5cdFx0XHQwOiBQZXJpb2QuU3RhZ2VzLkxPT1AsXHJcblx0XHRcdDE6IFBlcmlvZC5TdGFnZXMuUExBWSxcclxuXHRcdFx0MjogUGVyaW9kLlN0YWdlcy5QTEFZLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGFpbS5jb25maWcodGhpcywgUEkgLyA4MCwgODAsIC4yKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoYWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQxOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQyOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQ0OiBBaW0uU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBjaGFzZSA9IG5ldyBDaGFzZSgpO1xyXG5cdFx0Y2hhc2UuY29uZmlnKHRoaXMsIC4wMDIsIGFpbSk7XHJcblx0XHRwZXJpb2QuYWRkTW9kdWxlKGNoYXNlLCB7XHJcblx0XHRcdDA6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQzOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDQ6IENoYXNlLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgZGFzaCA9IG5ldyBEYXNoKCk7XHJcblx0XHRkYXNoLmNvbmZpZyh0aGlzLCAuMjUsIDIwKTtcclxuXHRcdHBlcmlvZC5hZGRNb2R1bGUoZGFzaCwge1xyXG5cdFx0XHQwOiBEYXNoLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogRGFzaC5TdGFnZXMuQUlNSU5HLFxyXG5cdFx0XHQyOiBEYXNoLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHQzOiBEYXNoLlN0YWdlcy5EQVNISU5HLFxyXG5cdFx0XHQ0OiBEYXNoLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCB0cmlnZ2VyRGFzaEVuZCA9IG5ldyBUcmlnZ2VyKCk7XHJcblx0XHR0cmlnZ2VyRGFzaEVuZC5jb25maWcoMSk7XHJcblx0XHRkYXNoLmFkZE1vZHVsZSh0cmlnZ2VyRGFzaEVuZCwge1xyXG5cdFx0XHRbRGFzaC5QaGFzZXMuSU5BQ1RJVkVdOiBUcmlnZ2VyLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5BSU1JTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLldBUk5JTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Rhc2guUGhhc2VzLkRBU0hJTkddOiBUcmlnZ2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBuZWFyYnlEZWdlbiA9IG5ldyBOZWFyYnlEZWdlbigpO1xyXG5cdFx0bmVhcmJ5RGVnZW4uY29uZmlnKGRhc2gudGFyZ2V0LCAuMTUsIC4wNik7XHJcblx0XHR0cmlnZ2VyRGFzaEVuZC5hZGRNb2R1bGUobmVhcmJ5RGVnZW4sIHtcclxuXHRcdFx0W1RyaWdnZXIuUGhhc2VzLlVOVFJJR0dFUkVEXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRbVHJpZ2dlci5QaGFzZXMuVFJJR0dFUkVEXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cdFx0ZGFzaC5hZGRNb2R1bGUobmVhcmJ5RGVnZW4sIHtcclxuXHRcdFx0W0Rhc2guUGhhc2VzLklOQUNUSVZFXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRbRGFzaC5QaGFzZXMuQUlNSU5HXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdFtEYXNoLlBoYXNlcy5XQVJOSU5HXTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHR9KTtcclxuXHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBEYXNoQ2hhc2VyO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgRGlhbW9uZFNoaXAgPSByZXF1aXJlKCcuLi8uLi8uLi9ncmFwaGljcy9EaWFtb25kU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3Qge1BJfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9EaXN0YW5jZScpO1xyXG5jb25zdCBBaW0gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0FpbScpO1xyXG5jb25zdCBQYXR0ZXJuZWRQZXJpb2QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL1BhdHRlcm5lZFBlcmlvZCcpO1xyXG5jb25zdCBDaGFzZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQ2hhc2UnKTtcclxuY29uc3QgTmVhcmJ5RGVnZW4gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL05lYXJieURlZ2VuJyk7XHJcblxyXG5jb25zdCBQaGFzZXMgPSBtYWtlRW51bSgnT05FJyk7XHJcblxyXG5jbGFzcyBFeHBsb2RpbmdUaWNrIGV4dGVuZHMgTW9uc3RlciB7XHJcblx0Y29uc3RydWN0b3IoeCwgeSkge1xyXG5cdFx0c3VwZXIoeCwgeSwgLjA0LCAuMDQsIC42KTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IERpYW1vbmRTaGlwKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKX0pKTtcclxuXHJcblx0XHR0aGlzLmF0dGFja1BoYXNlID0gbmV3IFBoYXNlKDApO1xyXG5cclxuXHRcdGxldCBkaXN0YW5jZSA9IG5ldyBEaXN0YW5jZSgpO1xyXG5cdFx0ZGlzdGFuY2UuY29uZmlnKHRoaXMsIC4xLCAxKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUoZGlzdGFuY2UsIHtbUGhhc2VzLk9ORV06IERpc3RhbmNlLlN0YWdlcy5BQ1RJVkV9KTtcclxuXHJcblx0XHRsZXQgcGF0dGVybmVkUGVyaW9kID0gbmV3IFBhdHRlcm5lZFBlcmlvZCgpO1xyXG5cdFx0cGF0dGVybmVkUGVyaW9kLmNvbmZpZyhbMCwgNjAsIDYwLCA2MF0sIFtbMF0sIFsxLCAyLCAzXSwgWzNdXSwgW2ZhbHNlLCBmYWxzZSwgdHJ1ZV0pO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKHBhdHRlcm5lZFBlcmlvZCwge1xyXG5cdFx0XHQwOiBbUGF0dGVybmVkUGVyaW9kLlByaW1hcnlTdGFnZXMuTE9PUCwgMV0sXHJcblx0XHRcdDE6IFtQYXR0ZXJuZWRQZXJpb2QuUHJpbWFyeVN0YWdlcy5QTEFZLCAyXSxcclxuXHRcdFx0MjogW1BhdHRlcm5lZFBlcmlvZC5QcmltYXJ5U3RhZ2VzLlNUT1BdLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGFpbS5jb25maWcodGhpcywgUEkgLyAyMCwgNTAsIC4xKTtcclxuXHRcdHBhdHRlcm5lZFBlcmlvZC5hZGRNb2R1bGUoYWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDM6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlID0gbmV3IENoYXNlKCk7XHJcblx0XHRjaGFzZS5jb25maWcodGhpcywgLjAwMywgYWltKTtcclxuXHRcdHBhdHRlcm5lZFBlcmlvZC5hZGRNb2R1bGUoY2hhc2UsIHtcclxuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQxOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IENoYXNlLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGxldCBkZWdlbiA9IG5ldyBOZWFyYnlEZWdlbigpO1xyXG5cdFx0ZGVnZW4uY29uZmlnKHRoaXMsIC4xNSwgLjAwMyk7XHJcblx0XHRwYXR0ZXJuZWRQZXJpb2QuYWRkTW9kdWxlKGRlZ2VuLCB7XHJcblx0XHRcdDA6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MTogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdDI6IE5lYXJieURlZ2VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDM6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdGRpc3RhbmNlLm1vZHVsZXNTZXRTdGFnZSgwKTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5tb2R1bGVzU2V0U3RhZ2UodGhpcy5hdHRhY2tQaGFzZS5nZXQoKSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEV4cGxvZGluZ1RpY2s7XHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1lY2hhbmljYWxCb3NzRWFybHkgPSByZXF1aXJlKCcuL01lY2hhbmljYWxCb3NzRWFybHknKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvUGVyaW9kJyk7XHJcbmNvbnN0IFBvc2l0aW9uID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9Qb3NpdGlvbicpO1xyXG5jb25zdCBBcmVhRGVnZW5MYXllciA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQXJlYURlZ2VuTGF5ZXInKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIE1lY2hhbmljYWxCb3NzIGV4dGVuZHMgTWVjaGFuaWNhbEJvc3NFYXJseSB7XHJcblx0YWRkTW9kdWxlcygpIHtcclxuXHRcdHN1cGVyLmFkZE1vZHVsZXMoKTtcclxuXHRcdHRoaXMuYWRkU3Vycm91bmREZWdlbk1vZHVsZSgpO1xyXG5cdFx0dGhpcy5hZGRDaGFzZURlZ2VuTW9kdWxlKCk7XHJcblx0fVxyXG5cclxuXHRhZGRTdXJyb3VuZERlZ2VuTW9kdWxlKCkge1xyXG5cdFx0bGV0IHN1cnJvdW5kRGVnZW5QZXJpb2QgPSBuZXcgUGVyaW9kKCk7XHJcblx0XHRzdXJyb3VuZERlZ2VuUGVyaW9kLmNvbmZpZygxLCAzOCwgMSk7XHJcblx0XHR0aGlzLnBlcmlvZC5hZGRNb2R1bGUoc3Vycm91bmREZWdlblBlcmlvZCwge1xyXG5cdFx0XHQwOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHRcdDE6IFBlcmlvZC5TdGFnZXMuTE9PUCxcclxuXHRcdFx0MjogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQzOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHR9KTtcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDE7IGkrKykge1xyXG5cdFx0XHRsZXQgc3Vycm91bmREZWdlblRhcmdldCA9IG5ldyBQb3NpdGlvbigpO1xyXG5cdFx0XHRzdXJyb3VuZERlZ2VuVGFyZ2V0LmNvbmZpZyh0aGlzLCAuMiwgLjUpO1xyXG5cdFx0XHRzdXJyb3VuZERlZ2VuUGVyaW9kLmFkZE1vZHVsZShzdXJyb3VuZERlZ2VuVGFyZ2V0LCB7XHJcblx0XHRcdFx0MDogUG9zaXRpb24uU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0XHQxOiBQb3NpdGlvbi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MjogUG9zaXRpb24uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGxldCBzdXJyb3VuZERlZ2VuID0gbmV3IEFyZWFEZWdlbkxheWVyKCk7XHJcblx0XHRcdHN1cnJvdW5kRGVnZW4uY29uZmlnKHN1cnJvdW5kRGVnZW5UYXJnZXQsIC4xLCAyMDAsIC4wMDIpO1xyXG5cdFx0XHRzdXJyb3VuZERlZ2VuUGVyaW9kLmFkZE1vZHVsZShzdXJyb3VuZERlZ2VuLCB7XHJcblx0XHRcdFx0MDogQXJlYURlZ2VuTGF5ZXIuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDE6IEFyZWFEZWdlbkxheWVyLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHRcdDI6IEFyZWFEZWdlbkxheWVyLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0YWRkQ2hhc2VEZWdlbk1vZHVsZSgpIHtcclxuXHRcdGxldCBjaGFzZURlZ2VuUGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0Y2hhc2VEZWdlblBlcmlvZC5jb25maWcoMSwgMzgsIDEpO1xyXG5cdFx0dGhpcy5wZXJpb2QuYWRkTW9kdWxlKGNoYXNlRGVnZW5QZXJpb2QsIHtcclxuXHRcdFx0MDogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQxOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHRcdDI6IFBlcmlvZC5TdGFnZXMuU1RPUCxcclxuXHRcdFx0MzogUGVyaW9kLlN0YWdlcy5MT09QLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlRGVnZW5UYXJnZXQgPSBuZXcgUG9zaXRpb24oKTtcclxuXHRcdGNoYXNlRGVnZW5UYXJnZXQuY29uZmlnKCk7XHJcblx0XHRjaGFzZURlZ2VuUGVyaW9kLmFkZE1vZHVsZShjaGFzZURlZ2VuVGFyZ2V0LCB7XHJcblx0XHRcdDA6IFBvc2l0aW9uLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IFBvc2l0aW9uLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogUG9zaXRpb24uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGNoYXNlRGVnZW4gPSBuZXcgQXJlYURlZ2VuTGF5ZXIoKTtcclxuXHRcdGNoYXNlRGVnZW4uY29uZmlnKGNoYXNlRGVnZW5UYXJnZXQsIC4xLCAyMDAsIC4wMDIpO1xyXG5cdFx0Y2hhc2VEZWdlblBlcmlvZC5hZGRNb2R1bGUoY2hhc2VEZWdlbiwge1xyXG5cdFx0XHQwOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IEFyZWFEZWdlbkxheWVyLlN0YWdlcy5XQVJOSU5HLFxyXG5cdFx0XHQyOiBBcmVhRGVnZW5MYXllci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lY2hhbmljYWxCb3NzO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgUmVjdDFEb3RzU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL1JlY3QxRG90c1NoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvVmVjdG9yJyk7XHJcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9EaXN0YW5jZScpO1xyXG5jb25zdCBQZXJpb2QgPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL1BlcmlvZCcpO1xyXG5jb25zdCBOZWFyYnlEZWdlbiA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvTmVhcmJ5RGVnZW4nKTtcclxuY29uc3QgQWltID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9BaW0nKTtcclxuY29uc3QgU2hvdGd1biA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvU2hvdGd1bicpO1xyXG5jb25zdCBTdGF0aWNMYXNlciA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvU3RhdGljTGFzZXInKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIE1lY2hhbmljYWxCb3NzRWFybHkgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMiwgLjIsIDIyKTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFJlY3QxRG90c1NoaXAodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKSkpO1xyXG5cclxuXHRcdHRoaXMuYWRkTW9kdWxlcygpO1xyXG5cclxuXHRcdHRoaXMuYXR0YWNrUGhhc2UgPSBuZXcgUGhhc2UoMCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxuXHJcblx0YWRkTW9kdWxlcygpIHtcclxuXHRcdHRoaXMuYWRkUGFyZW50c01vZHVsZSgpO1xyXG5cdFx0dGhpcy5hZGROZWFyYnlEZWdlbk1vZHVsZSgpO1xyXG5cdFx0dGhpcy5hZGRGYXJBd2F5U2hvdGd1bk1vZHVsZSgpO1xyXG5cdFx0dGhpcy5hZGRMYXNlck1vZHVsZSgpO1xyXG5cdFx0dGhpcy5hZGRTaG90Z3VuRmlyZU1vZHVsZSgpO1xyXG5cdH1cclxuXHJcblx0YWRkUGFyZW50c01vZHVsZSgpIHtcclxuXHRcdHRoaXMuZGlzdGFuY2UgPSBuZXcgRGlzdGFuY2UoKTtcclxuXHRcdHRoaXMuZGlzdGFuY2UuY29uZmlnKHRoaXMsIC4yNSwgLjc1KTtcclxuXHRcdHRoaXMubW9kdWxlTWFuYWdlci5hZGRNb2R1bGUodGhpcy5kaXN0YW5jZSwge1tQaGFzZXMuT05FXTogRGlzdGFuY2UuU3RhZ2VzLkFDVElWRX0pO1xyXG5cclxuXHRcdHRoaXMucGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0dGhpcy5wZXJpb2QuY29uZmlnKDEwMCwgMjAwLCAxMDAsIDIwMCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHRoaXMucGVyaW9kLCB7W1BoYXNlcy5PTkVdOiBQZXJpb2QuU3RhZ2VzLkxPT1B9KTtcclxuXHR9XHJcblxyXG5cdGFkZE5lYXJieURlZ2VuTW9kdWxlKCkge1xyXG5cdFx0bGV0IG5lYXJieURlZ2VuUGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0bmVhcmJ5RGVnZW5QZXJpb2QuY29uZmlnKDUwLCAxNTAsIDEpO1xyXG5cdFx0bmVhcmJ5RGVnZW5QZXJpb2QucGVyaW9kcy5zZXRQaGFzZSgyKTtcclxuXHRcdHRoaXMuZGlzdGFuY2UuYWRkTW9kdWxlKG5lYXJieURlZ2VuUGVyaW9kLCB7XHJcblx0XHRcdDA6IFBlcmlvZC5TdGFnZXMuTE9PUCxcclxuXHRcdFx0MTogUGVyaW9kLlN0YWdlcy5QTEFZLFxyXG5cdFx0XHQyOiBQZXJpb2QuU3RhZ2VzLlBMQVksXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgbmVhcmJ5RGVnZW4gPSBuZXcgTmVhcmJ5RGVnZW4oKTtcclxuXHRcdG5lYXJieURlZ2VuLmNvbmZpZyh0aGlzLCAuNSwgLjAwMik7XHJcblx0XHRuZWFyYnlEZWdlblBlcmlvZC5hZGRNb2R1bGUobmVhcmJ5RGVnZW4sIHtcclxuXHRcdFx0MDogTmVhcmJ5RGVnZW4uU3RhZ2VzLldBUk5JTkcsXHJcblx0XHRcdDE6IE5lYXJieURlZ2VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IE5lYXJieURlZ2VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MzogTmVhcmJ5RGVnZW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHRhZGRGYXJBd2F5U2hvdGd1bk1vZHVsZSgpIHtcclxuXHRcdGxldCBmYXJBd2F5U2hvdGd1bkFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGZhckF3YXlTaG90Z3VuQWltLmNvbmZpZyh0aGlzLCAwKTtcclxuXHRcdHRoaXMuZGlzdGFuY2UuYWRkTW9kdWxlKGZhckF3YXlTaG90Z3VuQWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDI6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IGZhckF3YXlTaG90Z3VuID0gbmV3IFNob3RndW4oKTtcclxuXHRcdGZhckF3YXlTaG90Z3VuLmNvbmZpZyh0aGlzLCAuMSwgMSwgLjAxLCAwLCAyMDAsIC4wMSwgZmFyQXdheVNob3RndW5BaW0sIHRydWUpO1xyXG5cdFx0dGhpcy5kaXN0YW5jZS5hZGRNb2R1bGUoZmFyQXdheVNob3RndW4sIHtcclxuXHRcdFx0MDogU2hvdGd1bi5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdDE6IFNob3RndW4uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQyOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHR9XHJcblxyXG5cdGFkZExhc2VyTW9kdWxlKCkge1xyXG5cdFx0bGV0IGxhc2VyUGVyaW9kID0gbmV3IFBlcmlvZCgpO1xyXG5cdFx0bGFzZXJQZXJpb2QuY29uZmlnKDEsIDM4LCAxKTtcclxuXHRcdHRoaXMucGVyaW9kLmFkZE1vZHVsZShsYXNlclBlcmlvZCwge1xyXG5cdFx0XHQwOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHRcdDE6IFBlcmlvZC5TdGFnZXMuTE9PUCxcclxuXHRcdFx0MjogUGVyaW9kLlN0YWdlcy5TVE9QLFxyXG5cdFx0XHQzOiBQZXJpb2QuU3RhZ2VzLlNUT1AsXHJcblx0XHR9KTtcclxuXHJcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDM7IGkrKykge1xyXG5cdFx0XHRsZXQgbGFzZXJBaW0gPSBuZXcgQWltKCk7XHJcblx0XHRcdGxhc2VyQWltLmNvbmZpZyh0aGlzLCAwLCAxLCAuMSk7XHJcblx0XHRcdGxhc2VyUGVyaW9kLmFkZE1vZHVsZShsYXNlckFpbSwge1xyXG5cdFx0XHRcdDA6IEFpbS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsZXQgc3RhdGljTGFzZXIgPSBuZXcgU3RhdGljTGFzZXIoKTtcclxuXHRcdFx0c3RhdGljTGFzZXIuY29uZmlnKHRoaXMsIC4wMDUsIC41LCBsYXNlckFpbSwgNDAsIC4wMDIsIC4wMSk7XHJcblx0XHRcdGxhc2VyUGVyaW9kLmFkZE1vZHVsZShzdGF0aWNMYXNlciwge1xyXG5cdFx0XHRcdDA6IFN0YXRpY0xhc2VyLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBTdGF0aWNMYXNlci5TdGFnZXMuV0FSTklORyxcclxuXHRcdFx0XHQyOiBTdGF0aWNMYXNlci5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0fVxyXG5cclxuXHRhZGRTaG90Z3VuRmlyZU1vZHVsZSgpIHtcclxuXHRcdFtbLTEsIC0xXSwgWy0xLCAxXSwgWzEsIC0xXSwgWzEsIDFdXS5mb3JFYWNoKHh5ID0+IHtcclxuXHRcdFx0bGV0IHNob3RndW5BaW0gPSBuZXcgQWltKCk7XHJcblx0XHRcdHNob3RndW5BaW0uY29uZmlnKHRoaXMsIDAsIDAsIDAsIG5ldyBWZWN0b3IoLi4ueHkpKTtcclxuXHRcdFx0dGhpcy5wZXJpb2QuYWRkTW9kdWxlKHNob3RndW5BaW0sIHtcclxuXHRcdFx0XHQwOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHRcdDE6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MjogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQzOiBBaW0uU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGxldCBzaG90Z3VuID0gbmV3IFNob3RndW4oKTtcclxuXHRcdFx0c2hvdGd1bi5jb25maWcodGhpcywgLjEsIDEsIC4wMDUsIC4wMDIsIDEwMCwgLjA0LCBzaG90Z3VuQWltLCB0cnVlKTtcclxuXHRcdFx0dGhpcy5wZXJpb2QuYWRkTW9kdWxlKHNob3RndW4sIHtcclxuXHRcdFx0XHQwOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQyOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQzOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1lY2hhbmljYWxCb3NzRWFybHk7XHJcblxyXG4vLyB0b2RvIFttZWRpdW1dIHJvdGF0aW9uXHJcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9FbnVtJyk7XHJcbmNvbnN0IE1vbnN0ZXIgPSByZXF1aXJlKCcuLi8uL01vbnN0ZXInKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBTcGxpdERpYW1vbmRTaGlwID0gcmVxdWlyZSgnLi4vLi4vLi4vZ3JhcGhpY3MvU3BsaXREaWFtb25kU2hpcCcpO1xyXG5jb25zdCBQaGFzZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvUGhhc2UnKTtcclxuY29uc3Qge1BJfSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IERpc3RhbmNlID0gcmVxdWlyZSgnLi4vLi4vbW9kdWxlcy9EaXN0YW5jZScpO1xyXG5jb25zdCBBaW0gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0FpbScpO1xyXG5jb25zdCBDaGFzZSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQ2hhc2UnKTtcclxuY29uc3QgQ29vbGRvd24gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL0Nvb2xkb3duJyk7XHJcbmNvbnN0IFNob3RndW4gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL1Nob3RndW4nKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIFNuaXBlclRpY2sgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDQsIC4wNCwgLjYpO1xyXG5cdFx0dGhpcy5zZXRHcmFwaGljcyhuZXcgU3BsaXREaWFtb25kU2hpcCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwge2ZpbGw6IHRydWUsIGNvbG9yOiBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XHJcblxyXG5cdFx0dGhpcy5hdHRhY2tQaGFzZSA9IG5ldyBQaGFzZSgwKTtcclxuXHJcblx0XHRsZXQgZGlzdGFuY2UgPSBuZXcgRGlzdGFuY2UoKTtcclxuXHRcdGRpc3RhbmNlLmNvbmZpZyh0aGlzLCAuNSwgLjcsIDEpO1xyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLmFkZE1vZHVsZShkaXN0YW5jZSwge1tQaGFzZXMuT05FXTogRGlzdGFuY2UuU3RhZ2VzLkFDVElWRX0pO1xyXG5cclxuXHRcdGxldCBjaGFzZUFpbSA9IG5ldyBBaW0oKTtcclxuXHRcdGNoYXNlQWltLmNvbmZpZyh0aGlzLCBQSSAvIDIwLCAxMDAsIDEpO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKGNoYXNlQWltLCB7XHJcblx0XHRcdDA6IEFpbS5TdGFnZXMuUkVWRVJTRSxcclxuXHRcdFx0MTogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0MjogQWltLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDM6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgY2hhc2UgPSBuZXcgQ2hhc2UoKTtcclxuXHRcdGNoYXNlLmNvbmZpZyh0aGlzLCAuMDAzLCBjaGFzZUFpbSk7XHJcblx0XHRkaXN0YW5jZS5hZGRNb2R1bGUoY2hhc2UsIHtcclxuXHRcdFx0MDogQ2hhc2UuU3RhZ2VzLkFDVElWRSxcclxuXHRcdFx0MTogQ2hhc2UuU3RhZ2VzLklOQUNUSVZFLFxyXG5cdFx0XHQyOiBDaGFzZS5TdGFnZXMuQUNUSVZFLFxyXG5cdFx0XHQzOiBDaGFzZS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgY29vbGRvd24gPSBuZXcgQ29vbGRvd24oKTtcclxuXHRcdGNvb2xkb3duLmNvbmZpZygyMDApO1xyXG5cdFx0ZGlzdGFuY2UuYWRkTW9kdWxlKGNvb2xkb3duLCB7XHJcblx0XHRcdDA6IENvb2xkb3duLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDE6IENvb2xkb3duLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdDI6IENvb2xkb3duLlN0YWdlcy5DT09MRE9XTixcclxuXHRcdFx0MzogQ29vbGRvd24uU3RhZ2VzLkNPT0xET1dOLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0bGV0IHNob3RndW5BaW0gPSBuZXcgQWltKCk7XHJcblx0XHRzaG90Z3VuQWltLmNvbmZpZyh0aGlzKTtcclxuXHRcdGNvb2xkb3duLmFkZE1vZHVsZShzaG90Z3VuQWltLCB7XHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVU5UUklHR0VSRURdOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Nvb2xkb3duLlBoYXNlcy5UUklHR0VSRURdOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRsZXQgc2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XHJcblx0XHRzaG90Z3VuLmNvbmZpZyh0aGlzLCAxLCAxLCAuMDEsIC4wMDEsIDEwMCwgLjA2LCBzaG90Z3VuQWltKTtcclxuXHRcdGNvb2xkb3duLmFkZE1vZHVsZShzaG90Z3VuLCB7XHJcblx0XHRcdFtDb29sZG93bi5QaGFzZXMuVU5UUklHR0VSRURdOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0W0Nvb2xkb3duLlBoYXNlcy5UUklHR0VSRURdOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHR9KTtcclxuXHJcblx0XHRkaXN0YW5jZS5tb2R1bGVzU2V0U3RhZ2UoMCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIubW9kdWxlc1NldFN0YWdlKHRoaXMuYXR0YWNrUGhhc2UuZ2V0KCkpO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTbmlwZXJUaWNrO1xyXG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvRW51bScpO1xyXG5jb25zdCBNb25zdGVyID0gcmVxdWlyZSgnLi4vLi9Nb25zdGVyJyk7XHJcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcclxuY29uc3QgUmVjdDREb3RzU2hpcCA9IHJlcXVpcmUoJy4uLy4uLy4uL2dyYXBoaWNzL1JlY3Q0RG90c1NoaXAnKTtcclxuY29uc3QgUGhhc2UgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL1BoYXNlJyk7XHJcbmNvbnN0IFZlY3RvciA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvVmVjdG9yJyk7XHJcbmNvbnN0IFBlcmlvZCA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvUGVyaW9kJyk7XHJcbmNvbnN0IEFpbSA9IHJlcXVpcmUoJy4uLy4uL21vZHVsZXMvQWltJyk7XHJcbmNvbnN0IFNob3RndW4gPSByZXF1aXJlKCcuLi8uLi9tb2R1bGVzL1Nob3RndW4nKTtcclxuXHJcbmNvbnN0IFBoYXNlcyA9IG1ha2VFbnVtKCdPTkUnKTtcclxuXHJcbmNsYXNzIFN0YXRpYzREaXJUdXJyZXQgZXh0ZW5kcyBNb25zdGVyIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHRzdXBlcih4LCB5LCAuMDksIC4wOSwgMS42KTtcclxuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFJlY3Q0RG90c1NoaXAodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIENvbG9ycy5FbnRpdHkuTU9OU1RFUi5nZXQoKSkpO1xyXG5cclxuXHRcdHRoaXMuYXR0YWNrUGhhc2UgPSBuZXcgUGhhc2UoMCk7XHJcblxyXG5cdFx0bGV0IHBlcmlvZCA9IG5ldyBQZXJpb2QoKTtcclxuXHRcdHBlcmlvZC5jb25maWcoMTIwLCA4MCk7XHJcblx0XHR0aGlzLm1vZHVsZU1hbmFnZXIuYWRkTW9kdWxlKHBlcmlvZCwge1tQaGFzZXMuT05FXTogUGVyaW9kLlN0YWdlcy5MT09QfSk7XHJcblxyXG5cdFx0W1xyXG5cdFx0XHR7eDogMSwgeTogMH0sXHJcblx0XHRcdHt4OiAwLCB5OiAxfSxcclxuXHRcdFx0e3g6IC0xLCB5OiAwfSxcclxuXHRcdFx0e3g6IDAsIHk6IC0xfSxcclxuXHRcdF0uZm9yRWFjaChkaXIgPT4ge1xyXG5cdFx0XHRsZXQgYWltID0gbmV3IEFpbSgpO1xyXG5cdFx0XHRhaW0uY29uZmlnKHRoaXMsIDAsIDAsIDAsIFZlY3Rvci5mcm9tT2JqKGRpcikpO1xyXG5cdFx0XHRwZXJpb2QuYWRkTW9kdWxlKGFpbSwge1xyXG5cdFx0XHRcdDA6IEFpbS5TdGFnZXMuSU5BQ1RJVkUsXHJcblx0XHRcdFx0MTogQWltLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsZXQgc2hvdGd1biA9IG5ldyBTaG90Z3VuKCk7XHJcblx0XHRcdHNob3RndW4uY29uZmlnKHRoaXMsIC4wNSwgMSwgLjAwMywgLjAwMDEsIDEwMCwgLjA0LCBhaW0sIHRydWUpO1xyXG5cdFx0XHRwZXJpb2QuYWRkTW9kdWxlKHNob3RndW4sIHtcclxuXHRcdFx0XHQwOiBTaG90Z3VuLlN0YWdlcy5JTkFDVElWRSxcclxuXHRcdFx0XHQxOiBTaG90Z3VuLlN0YWdlcy5BQ1RJVkUsXHJcblx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5tb2R1bGVNYW5hZ2VyLm1vZHVsZXNTZXRTdGFnZSh0aGlzLmF0dGFja1BoYXNlLmdldCgpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RhdGljNERpclR1cnJldDtcclxuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uLy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuY2xhc3MgRGFtYWdlRHVzdCBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHNpemUsIHZ4LCB2eSwgdGltZSkge1xuXHRcdHN1cGVyKHgsIHksIHNpemUsIHNpemUsIEludGVyc2VjdGlvbkZpbmRlci5MYXllcnMuSUdOT1JFKTtcblx0XHR0aGlzLnZ4ID0gdng7XG5cdFx0dGhpcy52eSA9IHZ5O1xuXHRcdHRoaXMudGltZSA9IHRpbWU7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0Y29uc3QgRlJJQ1RJT04gPSAuOTg7XG5cblx0XHRpZiAoIXRoaXMudGltZS0tKVxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR0aGlzLm1vdmUodGhpcy52eCwgdGhpcy52eSk7XG5cblx0XHR0aGlzLnZ4ICo9IEZSSUNUSU9OO1xuXHRcdHRoaXMudnkgKj0gRlJJQ1RJT047XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuREFNQUdFX0RVU1QuZ2V0KCl9KSk7XG5cdH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhbWFnZUR1c3Q7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBEdXN0IGV4dGVuZHMgRW50aXR5IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgc2l6ZSwgdngsIHZ5LCB0aW1lKSB7XG5cdFx0c3VwZXIoeCwgeSwgc2l6ZSwgc2l6ZSwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5JR05PUkUpO1xuXHRcdHRoaXMudnggPSB2eDtcblx0XHR0aGlzLnZ5ID0gdnk7XG5cdFx0dGhpcy50aW1lID0gdGltZTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHRjb25zdCBGUklDVElPTiA9IC45ODtcblxuXHRcdGlmICghdGhpcy50aW1lLS0pXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdHRoaXMubW92ZSh0aGlzLnZ4LCB0aGlzLnZ5KTtcblxuXHRcdHRoaXMudnggKj0gRlJJQ1RJT047XG5cdFx0dGhpcy52eSAqPSBGUklDVElPTjtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB0aGlzLngsIHRoaXMueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtjb2xvcjogQ29sb3JzLkVudGl0eS5EVVNULmdldCgpfSkpO1xuXHR9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEdXN0O1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSb2NrR3JhcGhpYyA9IHJlcXVpcmUoJy4uLy4uL2dyYXBoaWNzL1JvY2tHcmFwaGljJyk7XG5jb25zdCBCdWZmID0gcmVxdWlyZSgnLi4vQnVmZicpO1xuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9WZWN0b3InKTtcbmNvbnN0IHttaW5XaGljaEEsIHJhbmRJbnR9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBFZ2cgZXh0ZW5kcyBFbnRpdHkge1xuXHRjb25zdHJ1Y3Rvcihwb3NzaWJsZVBvc2l0aW9ucykge1xuXHRcdGNvbnN0IHNpemUgPSAuMTtcblx0XHRzdXBlcigwLCAwLCBzaXplLCBzaXplLCBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLlVOSVRfVFJBQ0tFUik7XG5cdFx0dGhpcy5wb3NzaWJsZVBvc2l0aW9ucyA9IHBvc3NpYmxlUG9zaXRpb25zO1xuXHRcdHRoaXMucmFuZG9tUG9zaXRpb24oKTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSb2NrR3JhcGhpYyhzaXplLCBzaXplLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuRUdHLmdldCgpfSkpO1xuXHRcdHRoaXMuc2xvd0RlYnVmZiA9IG5ldyBCdWZmKDAsIENvbG9ycy5FbnRpdHkuRUdHLCAnRUdHJyk7XG5cdFx0dGhpcy5zbG93RGVidWZmLm1vdmVTcGVlZCA9IC0uMztcblx0XHR0aGlzLnNsb3dEZWJ1ZmYuYXR0YWNrUmFuZ2UgPSAtLjM7XG5cdH1cblxuXHRyYW5kb21Qb3NpdGlvbigpIHtcblx0XHRsZXQge3gsIHl9ID0gdGhpcy5wb3NzaWJsZVBvc2l0aW9uc1tyYW5kSW50KHRoaXMucG9zc2libGVQb3NpdGlvbnMubGVuZ3RoKV07XG5cdFx0dGhpcy5zZXRQb3NpdGlvbih4LCB5KTtcblx0fVxuXG5cdHVwZGF0ZShtYXApIHtcblx0XHRpZiAodGhpcy5vd25lckhlcm8gJiYgIXRoaXMub3duZXJIZXJvLmhlYWx0aC5pc0VtcHR5KCkpXG5cdFx0XHR0aGlzLm93bmVySGVyby5jaGFuZ2VIZWFsdGgoLS4wMDEpO1xuXG5cdFx0aWYgKHRoaXMub3duZXJIZXJvICYmIHRoaXMub3duZXJIZXJvLmhlYWx0aC5pc0VtcHR5KCkpIHtcblx0XHRcdHRoaXMub3duZXJIZXJvID0gbnVsbDtcblx0XHRcdHRoaXMucmFuZG9tUG9zaXRpb24oKTtcblx0XHRcdHRoaXMuc2xvd0RlYnVmZi5leHBpcmUoKTtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMub3duZXJIZXJvKSB7XG5cdFx0XHRpZiAodGhpcy5xdWV1ZWRUcmFja2VkSW50ZXJzZWN0aW9uc1swXSkge1xuXHRcdFx0XHR0aGlzLm93bmVySGVybyA9IHRoaXMucXVldWVkVHJhY2tlZEludGVyc2VjdGlvbnNbMF07XG5cdFx0XHRcdHRoaXMucXVldWVkVHJhY2tlZEludGVyc2VjdGlvbnMgPSBbXTtcblx0XHRcdFx0dGhpcy5zbG93RGVidWZmLnJlc2V0KCk7XG5cdFx0XHRcdHRoaXMub3duZXJIZXJvLmFkZEJ1ZmYodGhpcy5zbG93RGVidWZmKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRwYWludChwYWludGVyLCBjYW1lcmEpIHtcblx0XHRpZiAoIXRoaXMub3duZXJIZXJvKVxuXHRcdFx0c3VwZXIucGFpbnQocGFpbnRlciwgY2FtZXJhKTtcblx0XHRlbHNlXG5cdFx0XHRwYWludGVyLmFkZChSZWN0Qy53aXRoQ2FtZXJhKGNhbWVyYSwgdGhpcy5vd25lckhlcm8ueCwgdGhpcy5vd25lckhlcm8ueSwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiBmYWxzZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuRUdHLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWdnO1xuIiwiY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vRW50aXR5Jyk7XG5jb25zdCBJbnRlcnNlY3Rpb25GaW5kZXIgPSByZXF1aXJlKCcuLi8uLi9pbnRlcnNlY3Rpb24vSW50ZXJzZWN0aW9uRmluZGVyJyk7XG5jb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCBSZWN0R3JhcGhpYyA9IHJlcXVpcmUoJy4uLy4uL2dyYXBoaWNzL1JlY3RHcmFwaGljJyk7XG5cbmNsYXNzIE1hcEJvdW5kYXJ5IGV4dGVuZHMgRW50aXR5IHtcblx0c3RhdGljIGNyZWF0ZUJveEJvdW5kYXJpZXMod2lkdGgsIGhlaWdodCkge1xuXHRcdGNvbnN0IGIgPSAuMTtcblx0XHRyZXR1cm4gW1xuXHRcdFx0Wy1iIC8gMiwgaGVpZ2h0IC8gMiwgYiwgaGVpZ2h0ICsgYiAqIDJdLCAvLyBsZWZ0XG5cdFx0XHRbd2lkdGggLyAyLCAtYiAvIDIsIHdpZHRoICsgYiAqIDIsIGJdLCAvLyB0b3Bcblx0XHRcdFt3aWR0aCArIGIgLyAyLCBoZWlnaHQgLyAyLCBiLCBoZWlnaHQgKyBiICogMl0sIC8vIHJpZ2h0XG5cdFx0XHRbd2lkdGggLyAyLCBoZWlnaHQgKyBiIC8gMiwgd2lkdGggKyBiICogMiwgYl0sIC8vIGJvdHRvbVxuXHRcdF0ubWFwKHh5V2lkdGhIZWlnaHQgPT5cblx0XHRcdG5ldyBNYXBCb3VuZGFyeSguLi54eVdpZHRoSGVpZ2h0KSk7XG5cdH1cblxuXHRjb25zdHJ1Y3RvciguLi54eVdpZHRoSGVpZ2h0KSB7XG5cdFx0c3VwZXIoLi4ueHlXaWR0aEhlaWdodCwgSW50ZXJzZWN0aW9uRmluZGVyLkxheWVycy5QQVNTSVZFKTtcblx0XHR0aGlzLnNldEdyYXBoaWNzKG5ldyBSZWN0R3JhcGhpYyh4eVdpZHRoSGVpZ2h0WzJdLCB4eVdpZHRoSGVpZ2h0WzNdLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuTUFQX0JPVU5EQVJZLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTWFwQm91bmRhcnk7XG4iLCJjb25zdCBFbnRpdHkgPSByZXF1aXJlKCcuLi9FbnRpdHknKTtcbmNvbnN0IEludGVyc2VjdGlvbkZpbmRlciA9IHJlcXVpcmUoJy4uLy4uL2ludGVyc2VjdGlvbi9JbnRlcnNlY3Rpb25GaW5kZXInKTtcbmNvbnN0IHtDb2xvcnN9ID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9Db25zdGFudHMnKTtcbmNvbnN0IFJvY2tHcmFwaGljID0gcmVxdWlyZSgnLi4vLi4vZ3JhcGhpY3MvUm9ja0dyYXBoaWMnKTtcblxuY2xhc3MgUm9jayBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHNpemUpIHtcblx0XHRzdXBlcih4LCB5LCBzaXplLCBzaXplLCBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLlBBU1NJVkUpO1xuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFJvY2tHcmFwaGljKHNpemUsIHNpemUsIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5ST0NLLmdldCgpfSkpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUm9jaztcbiIsImNvbnN0IEVudGl0eSA9IHJlcXVpcmUoJy4uL0VudGl0eScpO1xuY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi8uLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUm9ja0dyYXBoaWMgPSByZXF1aXJlKCcuLi8uLi9ncmFwaGljcy9Sb2NrR3JhcGhpYycpO1xuXG5jbGFzcyBSb2NrTWluZXJhbCBleHRlbmRzIEVudGl0eSB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHNpemUpIHtcblx0XHRzdXBlcih4LCB5LCBzaXplLCBzaXplLCBJbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzLlBBU1NJVkUpO1xuXHRcdHRoaXMuc2V0R3JhcGhpY3MobmV3IFJvY2tHcmFwaGljKHNpemUsIHNpemUsIHtmaWxsOiB0cnVlLCBjb2xvcjogQ29sb3JzLkVudGl0eS5ST0NLX01JTkVSQUwuZ2V0KCl9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSb2NrTWluZXJhbDtcbiIsImNvbnN0IEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcycpO1xuXG5jb25zdCBQT0lOVFMgPSBbXG5cdFswLCAxXSxcblx0WzEsIDBdLFxuXHRbMCwgLTFdLFxuXHRbLTEsIDBdXTtcblxuY2xhc3MgRGlhbW9uZFNoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBQT0lOVFMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERpYW1vbmRTaGlwO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFBPSU5UUyA9IFtcblx0WzAsIDFdLFxuXHRbMSwgMF0sXG5cdFswLCAtMV0sXG5cdFstMSwgMF1dO1xuXG5jbGFzcyBEb3VibGVIb3JpekRpYW1vbmQgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aFhZKC13aWR0aC8yLCAwLCB3aWR0aCwgaGVpZ2h0LCBQT0lOVFMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0XHR0aGlzLmFkZFBhdGhYWSh3aWR0aC8yLCAwLCB3aWR0aCwgaGVpZ2h0LCBQT0lOVFMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERvdWJsZUhvcml6RGlhbW9uZDtcbiIsImNvbnN0IFBhdGhDcmVhdG9yID0gcmVxdWlyZSgnLi9QYXRoQ3JlYXRvcicpO1xuXG5jbGFzcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMucGF0aENyZWF0b3JzID0gW107XG5cdH1cblxuXHQvLyB0b2RvIFttZWRpdW1dIGRlcHJlY2F0ZWQgYW5kIHJlcGxhY2Ugd2l0aCBhZGRQYXRoWFlcblx0YWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBwb2ludHMsIGNsb3NlZCwge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9ID0ge30pIHtcblx0XHRsZXQgcGF0aENyZWF0b3IgPSBuZXcgUGF0aENyZWF0b3IoKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRGaWxsKGZpbGwpO1xuXHRcdHBhdGhDcmVhdG9yLnNldENvbG9yKGNvbG9yKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRUaGlja25lc3ModGhpY2tuZXNzKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRTY2FsZSh3aWR0aCwgaGVpZ2h0LCBHcmFwaGljcy5jYWxjdWxhdGVTY2FsZShwb2ludHMpKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRDbG9zZWQoY2xvc2VkKTtcblx0XHRwb2ludHMuZm9yRWFjaChwb2ludCA9PiBwYXRoQ3JlYXRvci5tb3ZlVG8oLi4ucG9pbnQpKTtcblx0XHR0aGlzLnBhdGhDcmVhdG9ycy5wdXNoKHBhdGhDcmVhdG9yKTtcblx0fVxuXG5cdGFkZFBhdGhYWSh4LCB5LCB3aWR0aCwgaGVpZ2h0LCBwb2ludHMsIGNsb3NlZCwge2ZpbGwsIGNvbG9yLCB0aGlja25lc3N9ID0ge30pIHtcblx0XHRsZXQgcGF0aENyZWF0b3IgPSBuZXcgUGF0aENyZWF0b3IoKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRGaWxsKGZpbGwpO1xuXHRcdHBhdGhDcmVhdG9yLnNldENvbG9yKGNvbG9yKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRUaGlja25lc3ModGhpY2tuZXNzKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRUcmFuc2xhdGlvbih4LCB5KTtcblx0XHRwYXRoQ3JlYXRvci5zZXRTY2FsZSh3aWR0aCwgaGVpZ2h0LCBHcmFwaGljcy5jYWxjdWxhdGVTY2FsZShwb2ludHMpKTtcblx0XHRwYXRoQ3JlYXRvci5zZXRDbG9zZWQoY2xvc2VkKTtcblx0XHRwb2ludHMuZm9yRWFjaChwb2ludCA9PiBwYXRoQ3JlYXRvci5tb3ZlVG8oLi4ucG9pbnQpKTtcblx0XHR0aGlzLnBhdGhDcmVhdG9ycy5wdXNoKHBhdGhDcmVhdG9yKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSwgeCwgeSwgbW92ZURpcmVjdGlvbikge1xuXHRcdHRoaXMucGF0aENyZWF0b3JzLmZvckVhY2gocGF0aENyZWF0b3IgPT4ge1xuXHRcdFx0cGF0aENyZWF0b3Iuc2V0Q2FtZXJhKGNhbWVyYSk7XG5cdFx0XHRwYXRoQ3JlYXRvci5zZXRDZW50ZXIoeCwgeSk7XG5cdFx0XHRwYXRoQ3JlYXRvci5zZXRGb3J3YXJkKG1vdmVEaXJlY3Rpb24ueCwgbW92ZURpcmVjdGlvbi55KTtcblx0XHRcdHBhaW50ZXIuYWRkKHBhdGhDcmVhdG9yLmNyZWF0ZSgpKTtcblx0XHR9KTtcblx0fVxuXG5cdHN0YXRpYyBjYWxjdWxhdGVTY2FsZShwb2ludHMpIHtcblx0XHRsZXQgeHMgPSBwb2ludHMubWFwKChbeF0pID0+IHgpO1xuXHRcdGxldCB5cyA9IHBvaW50cy5tYXAoKFtfLCB5XSkgPT4geSk7XG5cdFx0bGV0IHhkID0gTWF0aC5tYXgoLi4ueHMpIC0gTWF0aC5taW4oLi4ueHMpO1xuXHRcdGxldCB5ZCA9IE1hdGgubWF4KC4uLnlzKSAtIE1hdGgubWluKC4uLnlzKTtcblx0XHRyZXR1cm4gMiAvICh4ZCArIHlkKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyYXBoaWNzO1xuIiwiY29uc3QgUGF0aENyZWF0b3IgPSByZXF1aXJlKCcuL1BhdGhDcmVhdG9yJyk7XG5jb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gUGF0aENyZWF0b3IuY3JlYXRlQ2lyY2xlUG9pbnRzKCk7XG5cbmNsYXNzIEhleGFnb25TaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBncmFwaGljT3B0aW9ucyA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZXhhZ29uU2hpcDtcbiIsImNvbnN0IFBhdGggPSByZXF1aXJlKCcuLi9wYWludGVyL1BhdGgnKTtcbmNvbnN0IHtQSTIsIHRoZXRhVG9WZWN0b3J9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcblxuY2xhc3MgUGF0aENyZWF0b3Ige1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLnN4ID0gLjE7IC8vIHRvZG8gW2xvd10gbmVjZXNzYXJ5IG9yIGd1YXJhbnRlZWQgdG8gYmUgb3ZlcndyaXR0ZW4/XG5cdFx0dGhpcy5zeSA9IC4xO1xuXHRcdHRoaXMudHggPSAwO1xuXHRcdHRoaXMudHkgPSAwO1xuXHRcdHRoaXMuZnggPSAwO1xuXHRcdHRoaXMuZnkgPSAtMTtcblx0XHR0aGlzLmN4ID0gMDtcblx0XHR0aGlzLmN5ID0gMDtcblxuXHRcdHRoaXMueHlzID0gW107XG5cdFx0dGhpcy54ID0gMDtcblx0XHR0aGlzLnkgPSAwO1xuXHR9XG5cblx0c2V0Q2FtZXJhKGNhbWVyYSkge1xuXHRcdHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXHR9XG5cblx0c2V0RmlsbChmaWxsKSB7XG5cdFx0dGhpcy5maWxsID0gZmlsbDtcblx0fVxuXG5cdHNldENvbG9yKGNvbG9yKSB7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHR9XG5cblx0c2V0VGhpY2tuZXNzKHRoaWNrbmVzcykge1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzO1xuXHR9XG5cblx0c2V0U2NhbGUoeCwgeSwgcykge1xuXHRcdHRoaXMuc3ggPSB4ICogcztcblx0XHR0aGlzLnN5ID0geSAqIHM7XG5cdFx0dGhpcy5zcyA9ICh4ICsgeSkgLyAyICogcztcblx0fVxuXG5cdHNldFRyYW5zbGF0aW9uKHgsIHkpIHtcblx0XHR0aGlzLnR4ID0geDtcblx0XHR0aGlzLnR5ID0geTtcblx0fVxuXG5cdHNldEZvcndhcmQoeCwgeSkge1xuXHRcdHRoaXMuZnggPSB4O1xuXHRcdHRoaXMuZnkgPSB5O1xuXHR9XG5cblx0c2V0Q2VudGVyKHgsIHkpIHtcblx0XHR0aGlzLmN4ID0geDtcblx0XHR0aGlzLmN5ID0geTtcblx0fVxuXG5cdHNldENsb3NlZChjbG9zZWQpIHtcblx0XHR0aGlzLmNsb3NlZCA9IGNsb3NlZDtcblx0fVxuXG5cdG1vdmVUbyh4LCB5LCBza2lwQWRkKSB7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHNraXBBZGQgfHwgdGhpcy5hZGQoKTtcblx0fVxuXG5cdG1vdmVCeSh4LCB5LCBza2lwQWRkKSB7XG5cdFx0dGhpcy54ICs9IHg7XG5cdFx0dGhpcy55ICs9IHk7XG5cdFx0c2tpcEFkZCB8fCB0aGlzLmFkZCgpO1xuXHR9XG5cblx0YWRkKCkge1xuXHRcdHRoaXMueHlzLnB1c2goW3RoaXMueCwgdGhpcy55XSk7XG5cdH1cblxuXHRjcmVhdGUoKSB7XG5cdFx0bGV0IHBhdGhQb2ludHMgPSB0aGlzLmNvbXB1dGVQYXRoUG9pbnRzKCk7XG5cdFx0bGV0IHRoaWNrbmVzcyA9IHRoaXMuY29tcHV0ZVRoaWNrbmVzcygpO1xuXHRcdHJldHVybiBuZXcgUGF0aChwYXRoUG9pbnRzLCB0aGlzLmNsb3NlZCwge2ZpbGw6IHRoaXMuZmlsbCwgY29sb3I6IHRoaXMuY29sb3IsIHRoaWNrbmVzc30pO1xuXHR9XG5cblx0Y29tcHV0ZVBhdGhQb2ludHMoKSB7XG5cdFx0Ly8gWzAsIDFdIG1hcHMgdG8gY2VudGVyICsgZm9yd2FyZFxuXHRcdGxldCBwYXRoUG9pbnRzID0gW107XG5cdFx0dGhpcy54eXMuZm9yRWFjaCgoW3gsIHldKSA9PiB7XG5cdFx0XHR4ID0geCAqIHRoaXMuc3ggKyB0aGlzLnR4O1xuXHRcdFx0eSA9IHkgKiB0aGlzLnN5ICsgdGhpcy50eTtcblx0XHRcdGxldCBwYXRoWCA9IHRoaXMuY3ggKyB0aGlzLmZ4ICogeSAtIHRoaXMuZnkgKiB4O1xuXHRcdFx0bGV0IHBhdGhZID0gdGhpcy5jeSArIHRoaXMuZnkgKiB5ICsgdGhpcy5meCAqIHg7XG5cdFx0XHRwYXRoUG9pbnRzLnB1c2goW3RoaXMuY2FtZXJhLnh0KHBhdGhYKSwgdGhpcy5jYW1lcmEueXQocGF0aFkpXSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHBhdGhQb2ludHM7XG5cdH1cblxuXHRjb21wdXRlVGhpY2tuZXNzKCkge1xuXHRcdHJldHVybiB0aGlzLmNhbWVyYS5zdCh0aGlzLnRoaWNrbmVzcyAqIHRoaXMuc3MpO1xuXHR9XG5cblx0Ly8gdG9kbyBbbWVkaXVtXSB1c2UgdGhpcyBldmVyeXdoZXJlIHdoZXJlIHVzZWZ1bFxuXHRzdGF0aWMgY3JlYXRlQ2lyY2xlUG9pbnRzKHIgPSAxLCBuID0gNiwgeCA9IDAsIHkgPSAwKSB7XG5cdFx0bGV0IHBvaW50cyA9IFtdO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG5cdFx0XHRsZXQgdGhldGEgPSBpICogUEkyIC8gbjtcblx0XHRcdGxldCB2ZWN0b3IgPSB0aGV0YVRvVmVjdG9yKHRoZXRhLCByKTtcblx0XHRcdHBvaW50cy5wdXNoKFt4ICsgdmVjdG9yWzBdLCB5ICsgdmVjdG9yWzFdXSk7XG5cdFx0fVxuXHRcdHJldHVybiBwb2ludHM7XG5cdH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGF0aENyZWF0b3I7XG4iLCJjb25zdCBQYXRoQ3JlYXRvciA9IHJlcXVpcmUoJy4vUGF0aENyZWF0b3InKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFJFQ1RfUE9JTlRTID0gW1xuXHRbMCwgMV0sXG5cdFsxLCAwXSxcblx0WzAsIC0xXSxcblx0Wy0xLCAwXV07XG5cbmNvbnN0IERPVF9TQ0FMRSA9IC4yO1xuY29uc3QgRE9UX1BPUyA9IC4yO1xuY29uc3QgRE9UX1BPSU5UUyA9IFBhdGhDcmVhdG9yLmNyZWF0ZUNpcmNsZVBvaW50cygxLCA2LCAwLCAwKTtcbmNvbnN0IERPVF9DT0xPUiA9IENvbG9yLmZyb20xKDEsIDEsIDEpLmdldCgpO1xuXG5jbGFzcyBSZWN0NERvdHNTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBjb2xvcikge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIFJFQ1RfUE9JTlRTLCB0cnVlLCB7ZmlsbDogdHJ1ZSwgY29sb3J9KTtcblx0XHR0aGlzLmFkZFBhdGhYWShcblx0XHRcdDAsIGhlaWdodCAqIERPVF9QT1MsXG5cdFx0XHR3aWR0aCAqIERPVF9TQ0FMRSwgaGVpZ2h0ICogRE9UX1NDQUxFLFxuXHRcdFx0RE9UX1BPSU5UUywgdHJ1ZSwge2ZpbGw6IHRydWUsIGNvbG9yOiBET1RfQ09MT1J9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q0RG90c1NoaXA7XG4iLCJjb25zdCBQYXRoQ3JlYXRvciA9IHJlcXVpcmUoJy4vUGF0aENyZWF0b3InKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFJFQ1RfUE9JTlRTID0gW1xuXHRbMCwgMV0sXG5cdFsxLCAwXSxcblx0WzAsIC0xXSxcblx0Wy0xLCAwXV07XG5cbmNvbnN0IERPVF9TQ0FMRSA9IC4xNTtcbmNvbnN0IERPVF9QT1MgPSAuMjU7XG5jb25zdCBET1RfUE9JTlRTID0gUGF0aENyZWF0b3IuY3JlYXRlQ2lyY2xlUG9pbnRzKDEsIDYsIDAsIDApO1xuY29uc3QgRE9UX0NPTE9SID0gQ29sb3IuZnJvbTEoMSwgMSwgMSkuZ2V0KCk7XG5cbmNsYXNzIFJlY3Q0RG90c1NoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGNvbG9yKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUkVDVF9QT0lOVFMsIHRydWUsIHtmaWxsOiB0cnVlLCBjb2xvcn0pO1xuXHRcdFJFQ1RfUE9JTlRTLmZvckVhY2goKFt4LCB5XSkgPT5cblx0XHRcdHRoaXMuYWRkUGF0aFhZKFxuXHRcdFx0XHR4ICogd2lkdGggKiBET1RfUE9TLCB5ICogaGVpZ2h0ICogRE9UX1BPUyxcblx0XHRcdFx0d2lkdGggKiBET1RfU0NBTEUsIGhlaWdodCAqIERPVF9TQ0FMRSxcblx0XHRcdFx0RE9UX1BPSU5UUywgdHJ1ZSwge2ZpbGw6IHRydWUsIGNvbG9yOiBET1RfQ09MT1J9KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWN0NERvdHNTaGlwO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNsYXNzIFJlY3RHcmFwaGljIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBncmFwaGljT3B0aW9ucyA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHRsZXQgcmVjdCA9IFtcblx0XHRcdFstMSwgLTFdLFxuXHRcdFx0Wy0xLCAxXSxcblx0XHRcdFsxLCAxXSxcblx0XHRcdFsxLCAtMV1dO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCByZWN0LCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBSZWN0R3JhcGhpYztcbiIsImNvbnN0IEdyYXBoaWNzID0gcmVxdWlyZSgnLi9HcmFwaGljcycpO1xuY29uc3Qge1BJMiwgdGhldGFUb1ZlY3RvciwgcmFuZH0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuXG4vLyBtaW4gbWFnbml0dWRlIG9mIGFsbCBwb2ludHMgd2lsbCBiZSBNSU5fTUFHTklUVURFIC8gKE1JTl9NQUdOSVRVREUgKyAxKVxuY29uc3QgUE9JTlRTID0gNSwgTUlOX01BR05JVFVERSA9IDE7XG5cbmNsYXNzIFJvY2tHcmFwaGljIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBncmFwaGljT3B0aW9ucyA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHRsZXQgcG9pbnRzID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBQT0lOVFM7IGkrKylcblx0XHRcdHBvaW50cy5wdXNoKHRoZXRhVG9WZWN0b3IoaSAqIFBJMiAvIFBPSU5UUywgcmFuZCgpICsgTUlOX01BR05JVFVERSkpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBwb2ludHMsIHRydWUsIGdyYXBoaWNPcHRpb25zKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvY2tHcmFwaGljO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IERJQU1PTkRfUE9JTlRTID0gW1xuXHRbMCwgMS41XSxcblx0WzEsIDBdLFxuXHRbMCwgLTEuNV0sXG5cdFstMSwgMF1dO1xuXG4vLyBjb25zdCBTUExJVF9QT0lOVFMgPSBbXG4vLyBcdFstMSwgMF0sXG4vLyBcdFsxLCAwXV07XG5cbmNsYXNzIFNwbGl0RGlhbW9uZFNoaXAgZXh0ZW5kcyBHcmFwaGljcyB7XG5cdGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBESUFNT05EX1BPSU5UUywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHRcdC8vIHRoaXMuYWRkUGF0aCh3aWR0aCwgaGVpZ2h0LCBTUExJVF9QT0lOVFMsIGZhbHNlLCB7Y29sb3I6ICdyZ2IoMjU1LDAsMjU1KSd9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNwbGl0RGlhbW9uZFNoaXA7XG4iLCJjb25zdCBQYXRoQ3JlYXRvciA9IHJlcXVpcmUoJy4vUGF0aENyZWF0b3InKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFBPSU5UUyA9IFBhdGhDcmVhdG9yLmNyZWF0ZUNpcmNsZVBvaW50cygpO1xuY29uc3QgQ09MT1IgPSBDb2xvci5mcm9tMjU1KDI0MCwgMjAwLCAyMzApLmdldCgpO1xuXG5jbGFzcyBUZXN0U2hpcCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIFBPSU5UUywgdHJ1ZSxcblx0XHRcdHtmaWxsOiB0cnVlLCBjb2xvcjogQ09MT1J9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRlc3RTaGlwO1xuIiwiY29uc3QgR3JhcGhpY3MgPSByZXF1aXJlKCcuL0dyYXBoaWNzJyk7XG5cbmNvbnN0IFBPSU5UUyA9IFtcblx0WzAsIDNdLCAvLyBmcm9udFxuXHRbMiwgLTFdLCAvLyByaWdodFxuXHRbMCwgLTNdLCAvLyBiYWNrXG5cdFstMiwgLTFdXTsgLy8gbGVmdFxuXG5jbGFzcyBWU2hpcCBleHRlbmRzIEdyYXBoaWNzIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMgPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy5hZGRQYXRoKHdpZHRoLCBoZWlnaHQsIFBPSU5UUywgdHJ1ZSwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVlNoaXA7XG4iLCJjb25zdCBHcmFwaGljcyA9IHJlcXVpcmUoJy4vR3JhcGhpY3MnKTtcblxuY29uc3QgUE9JTlRTID0gW1xuXHRbMSwgLjVdLFxuXHRbMywgMl0sXG5cdFsyLCAtMl0sXG5cdFswLCAtMV0sXG5cdFstMiwgLTJdLFxuXHRbLTMsIDJdLFxuXHRbLTEsIC41XV07XG5cbmNsYXNzIFdTaGlwIGV4dGVuZHMgR3JhcGhpY3Mge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBncmFwaGljT3B0aW9ucyA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLmFkZFBhdGgod2lkdGgsIGhlaWdodCwgUE9JTlRTLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXU2hpcDtcbiIsImNvbnN0IG1ha2VFbnVtID0gcmVxdWlyZSgnLi4vdXRpbC9FbnVtJyk7XG5jb25zdCBJbnRlcmZhY2UgPSByZXF1aXJlKCcuL0ludGVyZmFjZScpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xuXG5jb25zdCBTdGF0ZXMgPSBtYWtlRW51bSgnSU5BQ1RJVkUnLCAnQUNUSVZFJywgJ0hPVkVSJyk7XG5cbmNsYXNzIEJ1dHRvbiBleHRlbmRzIEludGVyZmFjZSB7XG5cdGNvbnN0cnVjdG9yKHRleHQpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuc3RhdGUgPSBTdGF0ZXMuSU5BQ1RJVkU7XG5cdFx0dGhpcy50ZXh0ID0gdGV4dDtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyKSB7XG5cdFx0bGV0IHt4LCB5fSA9IGNvbnRyb2xsZXIuZ2V0UmF3TW91c2UoKTtcblxuXHRcdGlmICghdGhpcy5ib3VuZHMuaW5zaWRlKHgsIHkpKVxuXHRcdFx0dGhpcy5zdGF0ZSA9IFN0YXRlcy5JTkFDVElWRTtcblx0XHRlbHNlXG5cdFx0XHR0aGlzLnN0YXRlID0gY29udHJvbGxlci5nZXRNb3VzZVN0YXRlKCkuYWN0aXZlID8gU3RhdGVzLkFDVElWRSA6IFN0YXRlcy5IT1ZFUjtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0XHRsZXQgY29sb3IgPSBbQ29sb3JzLkludGVyZmFjZS5JTkFDVElWRSwgQ29sb3JzLkludGVyZmFjZS5BQ1RJVkUsIENvbG9ycy5JbnRlcmZhY2UuSE9WRVJdW3RoaXMuc3RhdGVdLmdldCgpO1xuXG5cdFx0cGFpbnRlci5hZGQobmV3IFJlY3QodGhpcy5sZWZ0LCB0aGlzLnRvcCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcn0pKTtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdCh0aGlzLmxlZnQsIHRoaXMudG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCkpO1xuXHRcdHBhaW50ZXIuYWRkKG5ldyBUZXh0KHRoaXMubGVmdCArIHRoaXMud2lkdGggLyAyLCB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0IC8gMiwgdGhpcy50ZXh0KSk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCdXR0b247XG4iLCJjb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuLi9pbnRlcnNlY3Rpb24vQm91bmRzJyk7XG5cbmNsYXNzIEludGVyZmFjZSB7XG5cdHNldFBvc2l0aW9uKGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMubGVmdCA9IGxlZnQ7XG5cdFx0dGhpcy50b3AgPSB0b3A7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMuYm91bmRzID0gbmV3IEJvdW5kcyhsZWZ0LCB0b3AsIGxlZnQgKyB3aWR0aCwgdG9wICsgaGVpZ2h0KTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyKSB7XG5cdH1cblxuXHRwYWludChwYWludGVyKSB7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2U7XG4iLCJjb25zdCBtYWtlRW51bSA9IHJlcXVpcmUoJy4uL3V0aWwvRW51bScpO1xuXG5jb25zdCBEaXJlY3Rpb25zID0gbWFrZUVudW0oJ0xFRlQnLCAnVE9QJywgJ1JJR0hUJywgJ0JPVFRPTScpO1xuXG5jbGFzcyBCb3VuZHMge1xuXHRjb25zdHJ1Y3RvciguLi5sZWZ0VG9wUmlnaHRCb3R0b20pIHtcblx0XHRpZiAobGVmdFRvcFJpZ2h0Qm90dG9tKVxuXHRcdFx0dGhpcy5zZXQoLi4ubGVmdFRvcFJpZ2h0Qm90dG9tKTtcblx0fVxuXG5cdHNldChsZWZ0LCB0b3AsIHJpZ2h0ID0gbGVmdCwgYm90dG9tID0gdG9wKSB7XG5cdFx0dGhpcy52YWx1ZXMgPSBbXTtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLkxFRlRdID0gbGVmdDtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLlRPUF0gPSB0b3A7XG5cdFx0dGhpcy52YWx1ZXNbRGlyZWN0aW9ucy5SSUdIVF0gPSByaWdodDtcblx0XHR0aGlzLnZhbHVlc1tEaXJlY3Rpb25zLkJPVFRPTV0gPSBib3R0b207XG5cdH1cblxuXHRnZXQoZGlyZWN0aW9uKSB7XG5cdFx0cmV0dXJuIHRoaXMudmFsdWVzW2RpcmVjdGlvbl07XG5cdH1cblxuXHRnZXRPcHBvc2l0ZShkaXJlY3Rpb24pIHtcblx0XHRyZXR1cm4gdGhpcy5nZXQoQm91bmRzLm9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbikpO1xuXHR9XG5cblx0aW50ZXJzZWN0cyhib3VuZHMpIHtcblx0XHRjb25zdCBzaWducyA9IFstMSwgLTEsIDEsIDFdO1xuXHRcdHJldHVybiB0aGlzLnZhbHVlcy5ldmVyeSgodmFsdWUsIGRpcmVjdGlvbikgPT5cblx0XHRcdHZhbHVlICogc2lnbnNbZGlyZWN0aW9uXSA+IGJvdW5kcy5nZXRPcHBvc2l0ZShkaXJlY3Rpb24pICogc2lnbnNbZGlyZWN0aW9uXSk7XG5cdH1cblxuXHRpbnNpZGUoeCwgeSl7XG5cdFx0cmV0dXJuIHRoaXMuaW50ZXJzZWN0cyhuZXcgQm91bmRzKHgsIHksIHgsIHkpKTtcblx0fVxuXG5cdHN0YXRpYyBvcHBvc2l0ZURpcmVjdGlvbihkaXJlY3Rpb24pIHtcblx0XHRzd2l0Y2ggKGRpcmVjdGlvbikge1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLkxFRlQ6XG5cdFx0XHRcdHJldHVybiBEaXJlY3Rpb25zLlJJR0hUO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLlRPUDpcblx0XHRcdFx0cmV0dXJuIERpcmVjdGlvbnMuQk9UVE9NO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLlJJR0hUOlxuXHRcdFx0XHRyZXR1cm4gRGlyZWN0aW9ucy5MRUZUO1xuXHRcdFx0Y2FzZSBEaXJlY3Rpb25zLkJPVFRPTTpcblx0XHRcdFx0cmV0dXJuIERpcmVjdGlvbnMuVE9QO1xuXHRcdH1cblx0fVxufVxuXG5Cb3VuZHMuRGlyZWN0aW9ucyA9IERpcmVjdGlvbnM7XG5cbm1vZHVsZS5leHBvcnRzID0gQm91bmRzO1xuIiwiY29uc3QgbWFrZUVudW0gPSByZXF1aXJlKCcuLi91dGlsL0VudW0nKTtcclxuY29uc3QgTGlua2VkTGlzdCA9IHJlcXVpcmUoJy4uL3V0aWwvTGlua2VkTGlzdCcpO1xyXG5jb25zdCB7RVBTSUxPTiwgbWF4V2hpY2gsIHNldE1hZ25pdHVkZX0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBCb3VuZHMgPSByZXF1aXJlKCcuL0JvdW5kcycpO1xyXG5cclxuY29uc3QgTGF5ZXJzID0gbWFrZUVudW0oXHJcblx0J1BBU1NJVkUnLCAgICAgICAgICAgICAgLy8gaW50ZXJzZWN0cyB3aXRoIGV2ZXJ5dGhpbmdcclxuXHQnRlJJRU5ETFlfUFJPSkVDVElMRScsICAvLyBpbnRlcnNlY3RzIHdpdGggaG9zdGlsZSB1bml0cyBhbmQgcGFzc2l2ZXNcclxuXHQnRlJJRU5ETFlfVU5JVCcsICAgICAgICAvLyBpbnRlcnNlY3RzIHdpdGggaG9zdGlsZSB1bml0cywgaG9zdGlsZSBwcm9qZWN0aWxlcywgYW5kIHBhc3NpdmVzXHJcblx0J0hPU1RJTEVfUFJPSkVDVElMRScsICAgLy8gaW50ZXJzZWN0cyB3aXRoIGZyaWVuZGx5IHVuaXRzIGFuZCBwYXNzaXZlc1xyXG5cdCdIT1NUSUxFX1VOSVQnLCAgICAgICAgIC8vIGludGVyc2VjdHMgd2l0aCBmcmllbmRseSB1bml0cywgaG9zdGlsZSB1bml0cywgZnJpZW5kbHkgcHJvamVjdGlsZXMsIGFuZCBwYXNzaXZlc1xyXG5cdCdVTklUX1RSQUNLRVInLCAgICAgICAgIC8vIGludGVyc2VjdHMgd2l0aCBmcmllbmRseSBhbmQgaG9zdGlsZSB1bml0c1xyXG5cdCdJR05PUkUnKTsgICAgICAgICAgICAgIC8vIGludGVyc2VjdHMgd2l0aCBub3RoaW5nXHJcblxyXG5jb25zdCBDb2xsaXNpb25UeXBlcyA9IG1ha2VFbnVtKFxyXG5cdCdPRkYnLCAvLyB1bnVzZWQsIHVuc2V0L3VuZGVmaW5lZCBpbnN0ZWFkXHJcblx0J09OJyxcclxuXHQnVFJBQ0tfT05MWScsIC8vIHRyYWNrcyBjb2xsaXNpb25zIGJ1dCBkb2VzIG5vdCBwcmV2ZW50IG1vdmVtZW50XHJcbik7XHJcblxyXG5jbGFzcyBJbnRlcnNlY3Rpb25GaW5kZXIge1xyXG5cdGNvbnN0cnVjdG9yKCkge1xyXG5cdFx0dGhpcy5jb2xsaXNpb25zID0gT2JqZWN0LmtleXMoTGF5ZXJzKS5tYXAoKCkgPT4gW10pO1xyXG5cdFx0dGhpcy5ib3VuZHNHcm91cHMgPSBPYmplY3Qua2V5cyhMYXllcnMpLm1hcCgoKSA9PiBuZXcgTGlua2VkTGlzdCgpKTtcclxuXHJcblx0XHR0aGlzLmluaXRDb2xsaXNpb25zKCk7XHJcblx0fVxyXG5cclxuXHRpbml0Q29sbGlzaW9ucygpIHtcclxuXHRcdC8vIHRvZG8gW21lZGl1bV0gYWxsb3cgdW5pdHMgdG8gbW92ZSB0aHJvdWdoIHByb2plY3RpbGVzLCB3aGlsZSB0YWtpbmcgZGFtYWdlXHJcblx0XHQvLyBwYXNzaXZlcyBpbnRlcnNlY3Qgd2l0aCBldmVyeXRoaW5nXHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuUEFTU0lWRSwgTGF5ZXJzLkZSSUVORExZX1VOSVQpO1xyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLlBBU1NJVkUsIExheWVycy5GUklFTkRMWV9QUk9KRUNUSUxFKTtcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5QQVNTSVZFLCBMYXllcnMuRlJJRU5ETFlfVU5JVCk7XHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuUEFTU0lWRSwgTGF5ZXJzLkhPU1RJTEVfUFJPSkVDVElMRSk7XHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuUEFTU0lWRSwgTGF5ZXJzLkhPU1RJTEVfVU5JVCk7XHJcblxyXG5cdFx0Ly8gUHJvamVjdGlsZXMgaW50ZXJzZWN0IHdpdGggb3Bwb3NpbmcgdW5pdHMgdW4tc3ltbWV0cmljYWxseVxyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkZSSUVORExZX1BST0pFQ1RJTEUsIExheWVycy5IT1NUSUxFX1VOSVQsIGZhbHNlKTtcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5IT1NUSUxFX1BST0pFQ1RJTEUsIExheWVycy5GUklFTkRMWV9VTklULCBmYWxzZSk7XHJcblxyXG5cdFx0Ly8gZnJpZW5kbHkgdW5pdHMgaW50ZXJzZWN0IHdpdGggaG9zdGlsZSB1bml0c1xyXG5cdFx0dGhpcy5hZGRDb2xsaXNpb24oTGF5ZXJzLkZSSUVORExZX1VOSVQsIExheWVycy5IT1NUSUxFX1VOSVQpO1xyXG5cclxuXHRcdC8vIGhvc3RpbGUgdW5pdHMgaW50ZXJzZWN0cyB3aXRoIGhvc3RpbGUgdW5pdHNcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5IT1NUSUxFX1VOSVQsIExheWVycy5IT1NUSUxFX1VOSVQpO1xyXG5cclxuXHRcdC8vIHVuaXRzIHRyYWNrZXJzIGludGVyc2VjdCB3aXRoIGZyaWVuZGx5IGFuZCBob3N0aWxlIHVuaXRzIHVuLXN5bW1ldHJpY2FsbHlcclxuXHRcdHRoaXMuYWRkQ29sbGlzaW9uKExheWVycy5VTklUX1RSQUNLRVIsIExheWVycy5GUklFTkRMWV9VTklULCBmYWxzZSk7XHJcblx0XHR0aGlzLmFkZENvbGxpc2lvbihMYXllcnMuVU5JVF9UUkFDS0VSLCBMYXllcnMuSE9TVElMRV9VTklULCBmYWxzZSk7XHJcblx0fVxyXG5cclxuXHRhZGRDb2xsaXNpb24obGF5ZXIxLCBsYXllcjIsIHN5bW1ldHJpYyA9IHRydWUpIHtcclxuXHRcdHRoaXMuY29sbGlzaW9uc1tsYXllcjFdW2xheWVyMl0gPSBDb2xsaXNpb25UeXBlcy5PTjtcclxuXHRcdHRoaXMuY29sbGlzaW9uc1tsYXllcjJdW2xheWVyMV0gPSBzeW1tZXRyaWMgPyBDb2xsaXNpb25UeXBlcy5PTiA6IENvbGxpc2lvblR5cGVzLlRSQUNLX09OTFk7XHJcblx0fVxyXG5cclxuXHRhZGRCb3VuZHMobGF5ZXIsIGJvdW5kcywgcmVmZXJlbmNlKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5ib3VuZHNHcm91cHNbbGF5ZXJdLmFkZCh7Ym91bmRzLCByZWZlcmVuY2V9KVxyXG5cdH1cclxuXHJcblx0cmVtb3ZlQm91bmRzKGxheWVyLCBpdGVtKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5ib3VuZHNHcm91cHNbbGF5ZXJdLnJlbW92ZShpdGVtKTtcclxuXHR9XHJcblxyXG5cdGhhc0ludGVyc2VjdGlvbihzZWFyY2hMYXllciwgYm91bmRzKSB7XHJcblx0XHRsZXQgaXRlbSA9IHRoaXMuYm91bmRzR3JvdXBzW3NlYXJjaExheWVyXVxyXG5cdFx0XHQuZmluZCgoe2JvdW5kczogaUJvdW5kc30pID0+IGlCb3VuZHMuaW50ZXJzZWN0cyhib3VuZHMpKTtcclxuXHRcdHJldHVybiBpdGVtICYmIGl0ZW0udmFsdWUucmVmZXJlbmNlO1xyXG5cdH1cclxuXHJcblx0aW50ZXJzZWN0aW9ucyhsYXllciwgYm91bmRzKSB7XHJcblx0XHRyZXR1cm4gdGhpcy5jb2xsaXNpb25zW2xheWVyXS5mbGF0TWFwKChfLCBpTGF5ZXIpID0+XHJcblx0XHRcdHRoaXMuYm91bmRzR3JvdXBzW2lMYXllcl1cclxuXHRcdFx0XHQuZmlsdGVyKCh7Ym91bmRzOiBpQm91bmRzfSkgPT4gaUJvdW5kcy5pbnRlcnNlY3RzKGJvdW5kcykpXHJcblx0XHRcdFx0Lm1hcChpdGVtID0+IGl0ZW0udmFsdWUucmVmZXJlbmNlKSk7XHJcblx0fVxyXG5cclxuXHRjYW5Nb3ZlKGxheWVyLCBib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBub1NsaWRlKSB7XHJcblx0XHQvLyBpZiBtYWduaXR1ZGUgaXMgLTEsIHRoZW4gPGR4LCBkeT4gaXMgbm90IG5lY2Vzc2FyaWx5IGEgdW5pdCB2ZWN0b3IsIGFuZCBpdHMgbWFnbml0dWRlIHNob3VsZCBiZSB1c2VkXHJcblx0XHRpZiAobWFnbml0dWRlID09PSAtMSlcclxuXHRcdFx0KHt4OiBkeCwgeTogZHksIHByZXZNYWduaXR1ZGU6IG1hZ25pdHVkZX0gPSBzZXRNYWduaXR1ZGUoZHgsIGR5KSk7XHJcblxyXG5cdFx0aWYgKCFkeCAmJiAhZHkgfHwgbWFnbml0dWRlIDw9IDApXHJcblx0XHRcdHJldHVybiB7eDogMCwgeTogMCwgcmVmZXJlbmNlOiBbXSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzOiBbXX07XHJcblxyXG5cdFx0bGV0IG1vdmVYID0gMCwgbW92ZVkgPSAwO1xyXG5cclxuXHRcdGxldCBob3Jpem9udGFsID0gZHggPD0gMCA/IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQgOiBCb3VuZHMuRGlyZWN0aW9ucy5SSUdIVDtcclxuXHRcdGxldCB2ZXJ0aWNhbCA9IGR5IDw9IDAgPyBCb3VuZHMuRGlyZWN0aW9ucy5UT1AgOiBCb3VuZHMuRGlyZWN0aW9ucy5CT1RUT007XHJcblxyXG5cdFx0bGV0IGludGVyc2VjdGlvblJlZmVyZW5jZSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzID0gW107XHJcblx0XHRpZiAoZHggJiYgZHkpIHtcclxuXHRcdFx0bGV0IHttb3ZlLCBzaWRlLCByZWZlcmVuY2V9ID0gdGhpcy5jaGVja01vdmVFbnRpdGllc0ludGVyc2VjdGlvbihsYXllciwgYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIHRyYWNrZWRPbmx5UmVmZXJlbmNlcyk7XHJcblxyXG5cdFx0XHRtb3ZlWCArPSBkeCAqIG1vdmU7XHJcblx0XHRcdG1vdmVZICs9IGR5ICogbW92ZTtcclxuXHRcdFx0bWFnbml0dWRlIC09IG1vdmU7XHJcblxyXG5cdFx0XHRpZiAoIXNpZGUgfHwgbm9TbGlkZSkge1xyXG5cdFx0XHRcdHRyYWNrZWRPbmx5UmVmZXJlbmNlcyA9IHRyYWNrZWRPbmx5UmVmZXJlbmNlcy5maWx0ZXIoKFtfLCBtb3ZlVHJhY2tlZF0pID0+IG1vdmVUcmFja2VkIDw9IG1vdmUpLm1hcCgoW3JlZmVyZW5jZV0pID0+IHJlZmVyZW5jZSk7XHJcblx0XHRcdFx0cmV0dXJuIHt4OiBtb3ZlWCwgeTogbW92ZVksIHJlZmVyZW5jZSwgdHJhY2tlZE9ubHlSZWZlcmVuY2VzfTtcclxuXHRcdFx0fSBlbHNlIGlmIChzaWRlID09PSAxKSB7XHJcblx0XHRcdFx0aG9yaXpvbnRhbCA9IEJvdW5kcy5EaXJlY3Rpb25zLkxFRlQ7XHJcblx0XHRcdFx0ZHggPSAwO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHZlcnRpY2FsID0gQm91bmRzLkRpcmVjdGlvbnMuVE9QO1xyXG5cdFx0XHRcdGR5ID0gMDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aW50ZXJzZWN0aW9uUmVmZXJlbmNlID0gcmVmZXJlbmNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxldCB7bW92ZSwgcmVmZXJlbmNlfSA9IHRoaXMuY2hlY2tNb3ZlRW50aXRpZXNJbnRlcnNlY3Rpb24obGF5ZXIsIGJvdW5kcywgZHgsIGR5LCBtYWduaXR1ZGUsIGhvcml6b250YWwsIHZlcnRpY2FsLCB0cmFja2VkT25seVJlZmVyZW5jZXMpO1xyXG5cdFx0bW92ZVggKz0gZHggKiBtb3ZlO1xyXG5cdFx0bW92ZVkgKz0gZHkgKiBtb3ZlO1xyXG5cdFx0bWFnbml0dWRlIC09IG1vdmU7XHJcblx0XHR0cmFja2VkT25seVJlZmVyZW5jZXMgPSB0cmFja2VkT25seVJlZmVyZW5jZXMuZmlsdGVyKChbXywgbW92ZVRyYWNrZWRdKSA9PiBtb3ZlVHJhY2tlZCA8PSBtb3ZlKS5tYXAoKFtyZWZlcmVuY2VdKSA9PiByZWZlcmVuY2UpO1xyXG5cclxuXHRcdHJldHVybiB7eDogbW92ZVgsIHk6IG1vdmVZLCByZWZlcmVuY2U6IGludGVyc2VjdGlvblJlZmVyZW5jZSB8fCByZWZlcmVuY2UsIHRyYWNrZWRPbmx5UmVmZXJlbmNlc307XHJcblx0XHQvLyB0b2RvIFtsb3ddIHJldHVybiBsaXN0IG9mIGFsbCBpbnRlcnNlY3Rpb24gcmVmZXJlbmNlc1xyXG5cdH1cclxuXHJcblx0Ly8gbW92ZXMgYm91bmRzIHVudGlsIGludGVyc2VjdGluZyBvZiB0eXBlIE9OXHJcblx0Ly8gcmV0dXJucyBzaW1pbGFyIHRvIGNoZWNrTW92ZUVudGl0eUludGVyc2VjdGlvbiBpbiBhZGRpdGlvbiB0byByZWZlcmVuY2UsIHRoZSBjbG9zZXN0IE9OIGNvbGxpc2lvbiB0eXBlXHJcblx0Ly8gdHJhY2tPbmx5UmVmZXJlbmNlc1N1cGVyc2V0IGlzIGFuIG91dHB1dCBhcnJheSB0aGF0IHdpbGwgYmUgYXBwZW5kZWQgdG8gZm9yIGFsbCBUUkFDS19PTkxZIGNvbGxpc2lvbnMgZW5jb3VudGVyZWRcclxuXHQvLyB0cmFja09ubHlSZWZlcmVuY2VzU3VwZXJzZXQgd2lsbCBiZSBwYXJ0aWFsbHkgZmlsdGVyZWQgYnkgZGlzdGFuY2UgPCByZWZlcmVuY2VcclxuXHRjaGVja01vdmVFbnRpdGllc0ludGVyc2VjdGlvbihsYXllciwgYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIHRyYWNrT25seVJlZmVyZW5jZXNTdXBlcnNldCkge1xyXG5cdFx0bGV0IHNpZGUsIHJlZmVyZW5jZTtcclxuXHJcblx0XHR0aGlzLmNvbGxpc2lvbnNbbGF5ZXJdLmZvckVhY2goKGNvbGxpc2lvblR5cGUsIGlMYXllcikgPT5cclxuXHRcdFx0dGhpcy5ib3VuZHNHcm91cHNbaUxheWVyXS5mb3JFYWNoKCh7Ym91bmRzOiBpQm91bmRzLCByZWZlcmVuY2U6IGlSZWZlcmVuY2V9KSA9PiB7XHJcblx0XHRcdFx0aWYgKGlCb3VuZHMgPT09IGJvdW5kcylcclxuXHRcdFx0XHRcdHJldHVybjtcclxuXHRcdFx0XHRsZXQgaUludGVyc2VjdGlvbiA9IEludGVyc2VjdGlvbkZpbmRlci5jaGVja01vdmVFbnRpdHlJbnRlcnNlY3Rpb24oYm91bmRzLCBkeCwgZHksIG1hZ25pdHVkZSwgaG9yaXpvbnRhbCwgdmVydGljYWwsIGlCb3VuZHMpO1xyXG5cdFx0XHRcdGlmIChpSW50ZXJzZWN0aW9uKVxyXG5cdFx0XHRcdFx0aWYgKGNvbGxpc2lvblR5cGUgPT09IENvbGxpc2lvblR5cGVzLk9OKSB7XHJcblx0XHRcdFx0XHRcdCh7bW92ZTogbWFnbml0dWRlLCBzaWRlfSA9IGlJbnRlcnNlY3Rpb24pO1xyXG5cdFx0XHRcdFx0XHRyZWZlcmVuY2UgPSBpUmVmZXJlbmNlO1xyXG5cdFx0XHRcdFx0fSBlbHNlXHJcblx0XHRcdFx0XHRcdHRyYWNrT25seVJlZmVyZW5jZXNTdXBlcnNldC5wdXNoKFtpUmVmZXJlbmNlLCBpSW50ZXJzZWN0aW9uLm1vdmVdKVxyXG5cdFx0XHR9KSk7XHJcblxyXG5cdFx0cmV0dXJuIHttb3ZlOiBtYWduaXR1ZGUsIHNpZGUsIHJlZmVyZW5jZX07XHJcblx0fVxyXG5cclxuXHQvLyBjaGVja3MgZm9yIGludGVyc2VjdGlvbiBiZXR3ZWVuIGJvdW5kcyArIG1vdmVtZW50ICYgaWJvdW5kc1xyXG5cdC8vIHJldHVybnMgdW5kZWZpbmVkIGlmIG5vIGludGVyc2VjdGlvblxyXG5cdC8vIHJldHVybnMge21vdmU6IGhvdyBtdWNoIGNhbiBtb3ZlIHVudGlsIGludGVyc2VjdGlvbiwgc2lkZTogd2hpY2ggc2lkZSB0aGUgaW50ZXJzZWN0aW9uIG9jY3VycmVkICgwID0gbm9uZSwgMSA9IGhvcml6b250YWwsIDIgPSB2ZXJ0aWNhbCl9XHJcblx0c3RhdGljIGNoZWNrTW92ZUVudGl0eUludGVyc2VjdGlvbihib3VuZHMsIGR4LCBkeSwgbWFnbml0dWRlLCBob3Jpem9udGFsLCB2ZXJ0aWNhbCwgaUJvdW5kcykge1xyXG5cdFx0bGV0IGhvcml6b250YWxEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YShob3Jpem9udGFsLCBkeCwgYm91bmRzLCBpQm91bmRzLCBmYWxzZSk7XHJcblx0XHRsZXQgdmVydGljYWxEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YSh2ZXJ0aWNhbCwgZHksIGJvdW5kcywgaUJvdW5kcywgZmFsc2UpO1xyXG5cclxuXHRcdGlmIChob3Jpem9udGFsRGVsdGEgPj0gbWFnbml0dWRlIHx8IHZlcnRpY2FsRGVsdGEgPj0gbWFnbml0dWRlIHx8IGhvcml6b250YWxEZWx0YSA8IDAgJiYgdmVydGljYWxEZWx0YSA8IDApXHJcblx0XHRcdHJldHVybjtcclxuXHJcblx0XHRsZXQgW21heERlbHRhLCB3aGljaERlbHRhXSA9IG1heFdoaWNoKGhvcml6b250YWxEZWx0YSwgdmVydGljYWxEZWx0YSk7XHJcblxyXG5cdFx0bGV0IGhvcml6b250YWxGYXJEZWx0YSA9IEludGVyc2VjdGlvbkZpbmRlci5nZXREZWx0YShob3Jpem9udGFsLCBkeCwgYm91bmRzLCBpQm91bmRzLCB0cnVlKTtcclxuXHRcdGxldCB2ZXJ0aWNhbEZhckRlbHRhID0gSW50ZXJzZWN0aW9uRmluZGVyLmdldERlbHRhKHZlcnRpY2FsLCBkeSwgYm91bmRzLCBpQm91bmRzLCB0cnVlKTtcclxuXHJcblx0XHRpZiAobWF4RGVsdGEgPj0gMCAmJiBtYXhEZWx0YSA8IE1hdGgubWluKGhvcml6b250YWxGYXJEZWx0YSwgdmVydGljYWxGYXJEZWx0YSkpXHJcblx0XHRcdHJldHVybiB7bW92ZTogTWF0aC5tYXgobWF4RGVsdGEgLSBFUFNJTE9OLCAwKSwgc2lkZTogd2hpY2hEZWx0YSArIDF9O1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGdldERlbHRhKGRpcmVjdGlvbiwgZCwgYm91bmRzLCBpQm91bmRzLCBmYXIpIHtcclxuXHRcdGlmIChkKSB7XHJcblx0XHRcdGlmIChmYXIpXHJcblx0XHRcdFx0ZGlyZWN0aW9uID0gQm91bmRzLm9wcG9zaXRlRGlyZWN0aW9uKGRpcmVjdGlvbik7XHJcblx0XHRcdHJldHVybiAoaUJvdW5kcy5nZXRPcHBvc2l0ZShkaXJlY3Rpb24pIC0gYm91bmRzLmdldChkaXJlY3Rpb24pKSAvIGQ7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGlCb3VuZHMuZ2V0T3Bwb3NpdGUoZGlyZWN0aW9uKSA+IGJvdW5kcy5nZXQoZGlyZWN0aW9uKSAmJiBpQm91bmRzLmdldChkaXJlY3Rpb24pIDwgYm91bmRzLmdldE9wcG9zaXRlKGRpcmVjdGlvbikgXiBmYXJcclxuXHRcdFx0PyAwIDogSW5maW5pdHk7XHJcblx0fVxyXG59XHJcblxyXG5JbnRlcnNlY3Rpb25GaW5kZXIuTGF5ZXJzID0gTGF5ZXJzO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcnNlY3Rpb25GaW5kZXI7XHJcblxyXG4vLyB0b2RvIFtsb3ddIHN1cHBvcnQgcmVjdGFuZ3VsYXIgbW9iaWxlIChyb3RhdGluZyllbnRpdGllc1xyXG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IEtleW1hcHBpbmcgPSByZXF1aXJlKCcuLi9jb250cm9sL0tleW1hcHBpbmcnKTtcbmNvbnN0IE1hcCA9IHJlcXVpcmUoJy4uL21hcC9NYXAnKTtcbmNvbnN0IE1vbnN0ZXJLbm93bGVkZ2UgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9Nb25zdGVyS25vd2xlZGdlJyk7XG5jb25zdCBNYXBHZW5lcmF0b3IgPSByZXF1aXJlKCcuLi9tYXAvTWFwR2VuZXJhdG9yVGltZWQnKTtcbmNvbnN0IE1pbmltYXAgPSByZXF1aXJlKCcuLi9tYXAvTWluaW1hcCcpO1xuY29uc3QgQ2FtZXJhID0gcmVxdWlyZSgnLi4vY2FtZXJhL0NhbWVyYScpO1xuY29uc3QgU3RhcmZpZWxkID0gcmVxdWlyZSgnLi4vc3RhcmZpZWxkL1N0YXJmaWVsZCcpO1xuXG5jb25zdCBVSSA9IHRydWU7XG5cbmNsYXNzIEdhbWUgZXh0ZW5kcyBMb2dpYyB7XG5cdGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQsIE1hcEdlbmVyYXRvckNsYXNzID0gTWFwR2VuZXJhdG9yKSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlclNldCk7XG5cdFx0dGhpcy5tYXAgPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5tYXBHZW5lcmF0b3IgPSBuZXcgTWFwR2VuZXJhdG9yQ2xhc3ModGhpcy5tYXApO1xuXHRcdHRoaXMucGxheWVyID0gdGhpcy5tYXBHZW5lcmF0b3IucGxheWVyO1xuXHRcdHRoaXMubW9uc3Rlcktub3dsZWRnZSA9IG5ldyBNb25zdGVyS25vd2xlZGdlKCk7XG5cdFx0dGhpcy5tb25zdGVyS25vd2xlZGdlLnNldFBsYXllcih0aGlzLnBsYXllcik7XG5cdFx0dGhpcy5taW5pbWFwID0gbmV3IE1pbmltYXAodGhpcy5tYXApO1xuXHRcdHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcblx0XHR0aGlzLnN0YXJmaWVsZCA9IG5ldyBTdGFyZmllbGQoLi4udGhpcy5tYXAuZ2V0U2l6ZSgpKTtcblx0fVxuXG5cdGl0ZXJhdGUoKSB7XG5cdFx0dGhpcy51cGRhdGUoKTtcblx0XHR0aGlzLnBhaW50KCk7XG5cdH1cblxuXHR1cGRhdGUoKSB7XG5cdFx0dGhpcy51cGRhdGVDYW1lcmEoKTtcblx0XHR0aGlzLmNvbnRyb2xsZXIuaW52ZXJzZVRyYW5zZm9ybU1vdXNlKHRoaXMuY2FtZXJhKTtcblx0XHR0aGlzLm1hcEdlbmVyYXRvci51cGRhdGUoKTtcblx0XHR0aGlzLm1hcC51cGRhdGUodGhpcy5jb250cm9sbGVyLCB0aGlzLm1vbnN0ZXJLbm93bGVkZ2UpO1xuXHRcdHRoaXMubWluaW1hcC51cGRhdGUodGhpcy5jb250cm9sbGVyKTtcblx0fVxuXG5cdHVwZGF0ZUNhbWVyYSgpIHtcblx0XHR0aGlzLmNhbWVyYS5tb3ZlKHRoaXMucGxheWVyLCB0aGlzLmNvbnRyb2xsZXIuZ2V0UmF3TW91c2UoLjUsIC41KSk7XG5cdFx0dGhpcy5jYW1lcmEuem9vbShcblx0XHRcdEtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKHRoaXMuY29udHJvbGxlciwgS2V5bWFwcGluZy5Db250cm9scy5aT09NX09VVCkuYWN0aXZlLFxuXHRcdFx0S2V5bWFwcGluZy5nZXRDb250cm9sU3RhdGUodGhpcy5jb250cm9sbGVyLCBLZXltYXBwaW5nLkNvbnRyb2xzLlpPT01fSU4pLmFjdGl2ZSk7XG5cdH1cblxuXHRwYWludCgpIHtcblx0XHR0aGlzLnN0YXJmaWVsZC5wYWludCh0aGlzLnBhaW50ZXJTZXQucGFpbnRlciwgdGhpcy5jYW1lcmEpO1xuXHRcdHRoaXMubWFwLnBhaW50KHRoaXMucGFpbnRlclNldC5wYWludGVyLCB0aGlzLmNhbWVyYSk7XG5cdFx0aWYgKFVJKSB7XG5cdFx0XHR0aGlzLm1pbmltYXAucGFpbnQodGhpcy5wYWludGVyU2V0LnVpUGFpbnRlcik7XG5cdFx0XHR0aGlzLm1hcC5wYWludFVpKHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIsIHRoaXMuY2FtZXJhKTtcblx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHYW1lO1xuXG4vLyB0b2RvIFtncmFwaGljc11cbi8vIHRleHR1cmVzXG4vLyB1aSBpbnRlcmZhY2VcblxuLy8gdG9kbyBbY29udGVudF1cbi8vIG1hcCBnZW5lcmF0aW9uXG4vLyBpbnN0YW5jZXNcbi8vIG1vYnNcbi8vIHNlY3RvciBtb2Rlc1xuLy8gcmVzb3VyY2VzXG4vLyBjcmFmdGluZ1xuLy8gc2tpbGwgbGV2ZWxpbmdcblxuLy8gdG9kbyBbb3RoZXJdXG4vLyBjaGF0XG4vLyBzYXZlXG4vLyBtaW5pbWFwXG4vLyBjb25zaWRlciByZXN0cnVjdHVyaW5nIHBhY2thZ2VzLiBzcmM+YWJpbGl0aWVzICYgc3JjPmVudGl0aWVzPm1vZHVsZSByIHN5bW1ldHJpY1xuXG4vLyB0b2RvIFttb25zdGVyXVxuLy8gc2tpcm1lcnNoZXJcbi8vIGxhc2VyLCBzaG9ydCByYW5nZSByYWlkZXJzXG4vLyBsYXRjaGVycyB0aGF0IHJlZHVjZSBtYXggaGVhbHRoXG4vLyBsaW5rZXJzIHRoYXQgcmVkdWNlIHNwZWVkIGFuZCBkcmFpbiBoZWFsdGhcbi8vIHRyYXBzXG4vLyBkb3RzXG4iLCJjb25zdCBHYW1lID0gcmVxdWlyZSgnLi9HYW1lJyk7XG5jb25zdCBNYXBHZW5lcmF0b3JFZ2cgPSByZXF1aXJlKCcuLi9tYXAvTWFwR2VuZXJhdG9yRWdnJyk7XG5cbi8vIHRvZG8gW21lZGl1bV0gcmV3b3JrIGNhbnZhcyB0byBhdm9pZCBoYXZpbmcgdG8gc3ViY2xhc3MgYSBsb2dpYyBjbGFzcyBqdXN0IHRvIHNldCBhIGNvbnN0cnVjdG9yIHBhcmFtZXRlclxuY2xhc3MgR2FtZUVnZyBleHRlbmRzIEdhbWUge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyU2V0KSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlclNldCwgTWFwR2VuZXJhdG9yRWdnKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWVFZ2c7XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IFRlc3RTaGlwID0gcmVxdWlyZSgnLi4vZ3JhcGhpY3MvVGVzdFNoaXAnKTtcbmNvbnN0IHt0aGV0YVRvVmVjdG9yfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5cbmNvbnN0IGlkZiA9IGEgPT4gYTtcblxuY2xhc3MgR3JhcGhpY3NEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyU2V0KSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlclNldCk7XG5cdFx0dGhpcy53ID0gLjI7XG5cdFx0dGhpcy5oID0gLjI7XG5cdFx0dGhpcy54ID0gLjU7XG5cdFx0dGhpcy55ID0gLjU7XG5cdFx0dGhpcy50aGV0YSA9IDA7XG5cdFx0dGhpcy5kdGhldGEgPSAuMDUgKiBNYXRoLlBJIC8gMTgwO1xuXHRcdHRoaXMuc2hpcCA9IG5ldyBUZXN0U2hpcCh0aGlzLncsIHRoaXMuaCk7XG5cdFx0dGhpcy5mYWtlQ2FtZXJhID0ge3h0OiBpZGYsIHl0OiBpZGYsIHN0OiBpZGZ9O1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLnNoaXAgPSBuZXcgVGVzdFNoaXAodGhpcy53LCB0aGlzLmgpOyAvLyBtYWtlcyBpdCBlYXN5IHRvIHBsdWcgaW4gd2luZG93IHZhcmlhYmxlcyBpbiBjb25zdHJ1Y3RvciB0byBlZGl0IGxpdmVcblx0XHRsZXQgZGlyZWN0aW9uID0gdGhldGFUb1ZlY3Rvcih0aGlzLnRoZXRhICs9IHRoaXMuZHRoZXRhKTtcblx0XHR0aGlzLnNoaXAucGFpbnQodGhpcy5wYWludGVyU2V0LnBhaW50ZXIsIHRoaXMuZmFrZUNhbWVyYSwgdGhpcy54LCB0aGlzLnksIHt4OiBkaXJlY3Rpb25bMF0sIHk6IGRpcmVjdGlvblsxXX0pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JhcGhpY3NEZW1vO1xuIiwiY29uc3QgTG9naWMgPSByZXF1aXJlKCcuL0xvZ2ljJyk7XG5jb25zdCBCdXR0b24gPSByZXF1aXJlKCcuLi9pbnRlcmZhY2UvQnV0dG9uJyk7XG5cbmNsYXNzIEludGVyZmFjZURlbW8gZXh0ZW5kcyBMb2dpYyB7XG5cdGNvbnN0cnVjdG9yKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpIHtcblx0XHRzdXBlcihjb250cm9sbGVyLCBwYWludGVyU2V0KTtcblxuXHRcdHRoaXMuaW50ZXJmYWNlID0gbmV3IEJ1dHRvbigpO1xuXHRcdHRoaXMuaW50ZXJmYWNlLnNldFBvc2l0aW9uKC4yNSwgLjI1LCAuMiwgLjA0KTtcblx0fVxuXG5cdGl0ZXJhdGUoKSB7XG5cdFx0dGhpcy5pbnRlcmZhY2UudXBkYXRlKHRoaXMuY29udHJvbGxlcik7XG5cdFx0dGhpcy5pbnRlcmZhY2UucGFpbnQodGhpcy5wYWludGVyU2V0LnVpUGFpbnRlcik7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBJbnRlcmZhY2VEZW1vO1xuIiwiY2xhc3MgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyU2V0KSB7XG5cdFx0dGhpcy5jb250cm9sbGVyID0gY29udHJvbGxlcjtcblx0XHR0aGlzLnBhaW50ZXJTZXQgPSBwYWludGVyU2V0O1xuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvZ2ljO1xuIiwiY29uc3QgQ29udHJvbGxlciA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvQ29udHJvbGxlcicpO1xyXG5jb25zdCBQYWludGVyQ29tcG9zaXRvciA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUGFpbnRlckNvbXBvc2l0b3InKTtcclxuY29uc3QgRnBzVHJhY2tlciA9IHJlcXVpcmUoJy4uL3V0aWwvRnBzVHJhY2tlcicpO1xyXG5jb25zdCB7UG9zaXRpb25zfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFRleHQgPSByZXF1aXJlKCcuLi9wYWludGVyL1RleHQnKTtcclxuXHJcbmNsYXNzIExvb3BlciB7XHJcblx0c3RhdGljIHNsZWVwKG1pbGxpKSB7XHJcblx0XHRyZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIG1pbGxpKSlcclxuXHR9XHJcblxyXG5cdGNvbnN0cnVjdG9yKGNhbnZhcykge1xyXG5cdFx0dGhpcy5jYW52YXMgPSBjYW52YXM7XHJcblx0XHR0aGlzLmNvbnRyb2xsZXIgPSBuZXcgQ29udHJvbGxlcihjYW52YXMpO1xyXG5cdFx0dGhpcy5wYWludGVyU2V0ID0gbmV3IFBhaW50ZXJDb21wb3NpdG9yKGNhbnZhcyk7XHJcblx0XHR0aGlzLmZwc1RyYWNrZXIgPSBuZXcgRnBzVHJhY2tlcigpO1xyXG5cdFx0dGhpcy5sb29wKCk7XHJcblx0fVxyXG5cclxuXHRzZXRMb2dpY0NsYXNzKExvZ2ljQ2xhc3MpIHtcclxuXHRcdHRoaXMubG9naWMgPSBuZXcgTG9naWNDbGFzcyh0aGlzLmNvbnRyb2xsZXIsIHRoaXMucGFpbnRlclNldCk7XHJcblx0fVxyXG5cclxuXHRhc3luYyBsb29wKCkge1xyXG5cdFx0d2hpbGUgKHRydWUpIHtcclxuXHRcdFx0YXdhaXQgTG9vcGVyLnNsZWVwKDEwKTtcclxuXHRcdFx0aWYgKCF0aGlzLmxvZ2ljKVxyXG5cdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHR0aGlzLnBhaW50ZXJTZXQuY2xlYXIoKTtcclxuXHRcdFx0dGhpcy5sb2dpYy5pdGVyYXRlKCk7XHJcblx0XHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKG5ldyBUZXh0KDEgLSBQb3NpdGlvbnMuTUFSR0lOLCBQb3NpdGlvbnMuTUFSR0lOLCBgZnBzOiAke3RoaXMuZnBzVHJhY2tlci5nZXRGcHMoKX1gLCB7YWxpZ246ICdyaWdodCd9KSk7XHJcblx0XHRcdHRoaXMucGFpbnRlclNldC5wYWludCgpO1xyXG5cdFx0XHR0aGlzLmNvbnRyb2xsZXIuZXhwaXJlKCk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvb3BlcjtcclxuIiwiY29uc3QgTGlua2VkTGlzdCA9IHJlcXVpcmUoJy4uL3V0aWwvTGlua2VkTGlzdCcpO1xuY29uc3QgRW50aXR5ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvRW50aXR5Jyk7XG5jb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IE1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4uL21hcC9NYXBHZW5lcmF0b3JTdGFnZWQnKTtcbmNvbnN0IENhbWVyYSA9IHJlcXVpcmUoJy4uL2NhbWVyYS9DYW1lcmEnKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIEZha2VQbGF5ZXIge1xuXHRzZXRQb3NpdGlvbigpIHtcblx0fVxufVxuXG5jbGFzcyBGYWtlTWFwIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zdGlsbHMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMubW9uc3RlcnMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHR9XG5cblx0c2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHR9XG5cblx0YWRkU3RpbGwoc3RpbGwpIHtcblx0XHR0aGlzLnN0aWxscy5hZGQoc3RpbGwpO1xuXHR9XG5cblx0YWRkUGxheWVyKHBsYXllcikge1xuXHR9XG5cblx0YWRkTW9uc3Rlcihtb25zdGVyKSB7XG5cdFx0dGhpcy5tb25zdGVycy5hZGQobW9uc3Rlcik7XG5cdH1cblxuXHRhZGRVaSh1aSkge1xuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0dGhpcy5zdGlsbHMuZm9yRWFjaChzdGlsbCA9PiBzdGlsbC5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2gobW9uc3RlciA9PiBFbnRpdHkucHJvdG90eXBlLnBhaW50LmNhbGwobW9uc3RlciwgcGFpbnRlciwgY2FtZXJhKSk7IC8vIHRvIGF2b2lkIHBhaW50aW5nIG1vZHVsZXNcblx0fVxufVxuXG5jbGFzcyBNYXBEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyU2V0KSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlclNldCk7XG5cdFx0dGhpcy5yZXNldCgpO1xuXHRcdHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSh0aGlzLm1hcC53aWR0aCAvIDIsIHRoaXMubWFwLmhlaWdodCAvIDIsICh0aGlzLm1hcC53aWR0aCArIHRoaXMubWFwLmhlaWdodCkgLyAyKTtcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHRoaXMubWFwID0gbmV3IEZha2VNYXAoKTtcblx0XHR0aGlzLnBsYXllciA9IG5ldyBGYWtlUGxheWVyKCk7XG5cdFx0bmV3IE1hcEdlbmVyYXRvcih0aGlzLm1hcCk7XG5cdH1cblxuXHRpdGVyYXRlKCkge1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJyAnKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5yZXNldCgpO1xuXG5cdFx0dGhpcy51cGRhdGVDYW1lcmEoKTtcblxuXHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEodGhpcy5jYW1lcmEsIHRoaXMubWFwLndpZHRoIC8gMiwgdGhpcy5tYXAuaGVpZ2h0IC8gMiwgdGhpcy5tYXAud2lkdGgsIHRoaXMubWFwLmhlaWdodCwge2NvbG9yOiBDb2xvci5XSElURS5nZXQoKSwgdGhpY2tuZXNzOiAyfSkpO1xuXHRcdHRoaXMubWFwLnBhaW50KHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIsIHRoaXMuY2FtZXJhKTtcblx0fVxuXG5cdHVwZGF0ZUNhbWVyYSgpIHtcblx0XHRsZXQge3gsIHl9ID0gdGhpcy5jb250cm9sbGVyLmdldFJhd01vdXNlKC41LCAuNSk7XG5cdFx0dGhpcy5jYW1lcmEubW92ZSh7eDogeCAqIHRoaXMubWFwLndpZHRoLCB5OiB5ICogdGhpcy5tYXAuaGVpZ2h0fSwge3gsIHl9KTtcblx0XHR0aGlzLmNhbWVyYS56b29tKHRoaXMuY29udHJvbGxlci5nZXRLZXlTdGF0ZSgneicpLmFjdGl2ZSwgdGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCd4JykuYWN0aXZlKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcERlbW87XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IHtOb2lzZVNpbXBsZXh9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xuY29uc3Qge3JhbmR9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XG5cbmNvbnN0IFRIUkVTSE9MRCA9IC41O1xuY29uc3QgTiA9IDIwMDsgLy8gcmVzb2x1dGlvblxuY29uc3QgTlRIID0gMSAvIE47XG5jb25zdCBERUZBVUxUX05PSVNFX1JBTkdFID0gMjA7IC8vIGZlYXR1cmUgc2l6ZXMsIGJpZ2dlciBub2lzZVJhbmdlIG1lYW5zIHNtYWxsZXIgZmVhdHVyZXNcblxuY2xhc3MgTm9pc2VEZW1vIGV4dGVuZHMgTG9naWMge1xuXHRjb25zdHJ1Y3Rvcihjb250cm9sbGVyLCBwYWludGVyU2V0KSB7XG5cdFx0c3VwZXIoY29udHJvbGxlciwgcGFpbnRlclNldCk7XG5cdFx0dGhpcy5ub2lzZVJhbmdlID0gREVGQVVMVF9OT0lTRV9SQU5HRTtcblx0XHR0aGlzLnJlc2V0KCk7XG5cdH1cblxuXHRyZXNldCgpIHtcblx0XHR0aGlzLnJlc3VsdHMgPSBbXTtcblx0XHRsZXQgbm9pc2UgPSBuZXcgTm9pc2VTaW1wbGV4KHRoaXMubm9pc2VSYW5nZSk7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBOOyB4KyspIHtcblx0XHRcdHRoaXMucmVzdWx0c1t4XSA9IFtdO1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCBOOyB5KyspIHtcblx0XHRcdFx0bGV0IHIgPSBub2lzZS5nZXQoeCAqIE5USCwgeSAqIE5USCk7XG5cdFx0XHRcdGlmIChyID4gVEhSRVNIT0xEICsgcmFuZCgpKVxuXHRcdFx0XHRcdHRoaXMucmVzdWx0c1t4XVt5XSA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0aXRlcmF0ZSgpIHtcblx0XHR0aGlzLmNvbnRyb2woKTtcblx0XHR0aGlzLnBhaW50KCk7XG5cdH1cblxuXHRjb250cm9sKCkge1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJ2Fycm93ZG93bicpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UgLT0gNTtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd3VwJykucHJlc3NlZClcblx0XHRcdHRoaXMubm9pc2VSYW5nZSArPSA1O1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJ2Fycm93bGVmdCcpLnByZXNzZWQpXG5cdFx0XHR0aGlzLm5vaXNlUmFuZ2UtLTtcblx0XHRpZiAodGhpcy5jb250cm9sbGVyLmdldEtleVN0YXRlKCdhcnJvd3JpZ2h0JykucHJlc3NlZClcblx0XHRcdHRoaXMubm9pc2VSYW5nZSsrO1xuXHRcdGlmICh0aGlzLmNvbnRyb2xsZXIuZ2V0S2V5U3RhdGUoJyAnKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy5yZXNldCgpO1xuXHR9XG5cblx0cGFpbnQoKSB7XG5cdFx0Zm9yIChsZXQgeCA9IDA7IHggPCBOOyB4KyspXG5cdFx0XHRmb3IgKGxldCB5ID0gMDsgeSA8IE47IHkrKykge1xuXHRcdFx0XHRpZiAodGhpcy5yZXN1bHRzW3hdW3ldKSB7XG5cdFx0XHRcdFx0dGhpcy5wYWludGVyU2V0LnVpUGFpbnRlci5hZGQobmV3IFJlY3QoeCAqIE5USCwgeSAqIE5USCwgMSAvIE4sIDEgLyBOLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9yLkJMQUNLLmdldCgpfSkpO1xuXHRcdFx0XHRcdHRoaXMucGFpbnRlclNldC51aVBhaW50ZXIuYWRkKG5ldyBSZWN0QyguMSwgLjEsIC4wMywgLjAzLCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGAjZmZmYH0pKTtcblx0XHRcdFx0XHR0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyLmFkZChuZXcgVGV4dCguMSwgLjEsIHRoaXMubm9pc2VSYW5nZSkpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOb2lzZURlbW87XG4iLCJjb25zdCBMb2dpYyA9IHJlcXVpcmUoJy4vTG9naWMnKTtcbmNvbnN0IENhbWVyYSA9IHJlcXVpcmUoJy4uL2NhbWVyYS9DYW1lcmEnKTtcbmNvbnN0IENvbG9yID0gcmVxdWlyZSgnLi4vdXRpbC9Db2xvcicpO1xuY29uc3QgVGV4dCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvVGV4dCcpO1xuY29uc3QgU3RhcmZpZWxkID0gcmVxdWlyZSgnLi4vc3RhcmZpZWxkL1N0YXJmaWVsZCcpO1xuY29uc3QgU3RhcmZpZWxkTm9pc2UgPSByZXF1aXJlKCcuLi9zdGFyZmllbGQvU3RhcmZpZWxkTm9pc2UnKTtcblxuY2xhc3MgU3RhcmZpZWxkRGVtbyBleHRlbmRzIExvZ2ljIHtcblx0Y29uc3RydWN0b3IoY29udHJvbGxlciwgcGFpbnRlclNldCkge1xuXHRcdHN1cGVyKGNvbnRyb2xsZXIsIHBhaW50ZXJTZXQpO1xuXHRcdHRoaXMuY2FtZXJhID0gbmV3IENhbWVyYSgwLCAwLCAxKTtcblx0fVxuXG5cdGl0ZXJhdGUoKSB7XG5cdFx0dGhpcy5wZXJpb2RpY2FsbHlTd2FwU3RhcmZpZWxkKCk7XG5cdFx0bGV0IHt4LCB5fSA9IHRoaXMuY29udHJvbGxlci5nZXRSYXdNb3VzZSgpO1xuXHRcdHRoaXMuY2FtZXJhLm1vdmUoe3g6IHggLSAuNSwgeTogeSAtIC41fSwge3gsIHl9KTtcblx0XHR0aGlzLnN0YXJmaWVsZC5wYWludCh0aGlzLnBhaW50ZXJTZXQudWlQYWludGVyLCB0aGlzLmNhbWVyYSk7XG5cdFx0dGhpcy5wYWludGVyU2V0LnVpUGFpbnRlci5hZGQobmV3IFRleHQoLjA1LCAuMDUsIHRoaXMubm9pc2UgPyAnbm9pc2UnIDogJ3JhbmQnLCB7Y29sb3I6IENvbG9yLldISVRFLmdldCgpfSkpO1xuXHR9XG5cblx0cGVyaW9kaWNhbGx5U3dhcFN0YXJmaWVsZCgpIHtcblx0XHRpZiAoIXRoaXMuaXRlcikge1xuXHRcdFx0dGhpcy5pdGVyID0gMTAwO1xuXHRcdFx0dGhpcy5ub2lzZSA9ICF0aGlzLm5vaXNlO1xuXHRcdFx0dGhpcy5zdGFyZmllbGQgPSB0aGlzLm5vaXNlID8gbmV3IFN0YXJmaWVsZE5vaXNlKDEsIDEpIDogbmV3IFN0YXJmaWVsZCgxLCAxKTtcblx0XHR9XG5cdFx0dGhpcy5pdGVyLS07XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGFyZmllbGREZW1vO1xuIiwiY29uc3QgSW50ZXJzZWN0aW9uRmluZGVyID0gcmVxdWlyZSgnLi4vaW50ZXJzZWN0aW9uL0ludGVyc2VjdGlvbkZpbmRlcicpO1xuY29uc3QgTGlua2VkTGlzdCA9IHJlcXVpcmUoJy4uL3V0aWwvTGlua2VkTGlzdCcpO1xuY29uc3QgQm91bmRzID0gcmVxdWlyZSgnLi4vaW50ZXJzZWN0aW9uL0JvdW5kcycpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuXG5jbGFzcyBNYXAge1xuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHR0aGlzLmludGVyc2VjdGlvbkZpbmRlciA9IG5ldyBJbnRlcnNlY3Rpb25GaW5kZXIoKTtcblx0XHR0aGlzLnN0aWxscyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5ib3RzID0gbmV3IExpbmtlZExpc3QoKTtcblx0XHR0aGlzLmJvdEhlcm9lcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5tb25zdGVycyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5wcm9qZWN0aWxlcyA9IG5ldyBMaW5rZWRMaXN0KCk7XG5cdFx0dGhpcy5wYXJ0aWNsZXMgPSBuZXcgTGlua2VkTGlzdCgpO1xuXHRcdHRoaXMudWlzID0gbmV3IExpbmtlZExpc3QoKTtcblx0fVxuXG5cdHNldFNpemUod2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMud2lkdGggPSB3aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGhlaWdodDtcblx0fVxuXG5cdGdldFNpemUoKSB7XG5cdFx0cmV0dXJuIFt0aGlzLndpZHRoLCB0aGlzLmhlaWdodF07XG5cdH1cblxuXHRnZXQgaGVyb2VzKCkge1xuXHRcdHJldHVybiBbdGhpcy5wbGF5ZXIsIC4uLnRoaXMuYm90SGVyb2VzXTtcblx0fVxuXG5cdGFkZFN0aWxsKHN0aWxsKSB7XG5cdFx0dGhpcy5zdGlsbHMuYWRkKHN0aWxsKTtcblx0XHRzdGlsbC5hZGRJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHR9XG5cblx0YWRkUGxheWVyKHBsYXllcikge1xuXHRcdHRoaXMucGxheWVyID0gcGxheWVyO1xuXHRcdHBsYXllci5hZGRJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHRcdHRoaXMudWlzLmFkZChwbGF5ZXIpO1xuXHR9XG5cblx0YWRkQm90KGJvdCkge1xuXHRcdHRoaXMuYm90cy5hZGQoYm90KTtcblx0XHRib3QuYm90SGVyb2VzLmZvckVhY2goYm90SGVybyA9PiB0aGlzLmFkZEJvdEhlcm8oYm90SGVybykpO1xuXHR9XG5cblx0YWRkQm90SGVybyhib3RIZXJvKSB7XG5cdFx0dGhpcy5ib3RIZXJvZXMuYWRkKGJvdEhlcm8pO1xuXHRcdGJvdEhlcm8uYWRkSW50ZXJzZWN0aW9uQm91bmRzKHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKTtcblx0fVxuXG5cdGFkZE1vbnN0ZXIobW9uc3RlciwgdWkpIHtcblx0XHR0aGlzLm1vbnN0ZXJzLmFkZChtb25zdGVyKTtcblx0XHRtb25zdGVyLmFkZEludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0aWYgKHVpKVxuXHRcdFx0dGhpcy51aXMuYWRkKG1vbnN0ZXIpO1xuXHR9XG5cblx0YWRkVWkodWkpIHtcblx0XHR0aGlzLnVpcy5hZGQodWkpO1xuXHR9XG5cblx0YWRkUHJvamVjdGlsZShwcm9qZWN0aWxlKSB7IC8vIHRvZG8gW21lZGl1bV0gcmVuYW1lIHRvIGFkZEF0dGFjayBvciBzdWNoXG5cdFx0dGhpcy5wcm9qZWN0aWxlcy5hZGQocHJvamVjdGlsZSk7XG5cdFx0cHJvamVjdGlsZS5hZGRJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHR9XG5cblx0YWRkUGFydGljbGUocGFydGljbGUpIHtcblx0XHR0aGlzLnBhcnRpY2xlcy5hZGQocGFydGljbGUpO1xuXHR9XG5cblx0dXBkYXRlKGNvbnRyb2xsZXIsIG1vbnN0ZXJLbm93bGVkZ2UpIHtcblx0XHR0aGlzLnBsYXllci51cGRhdGUodGhpcywgY29udHJvbGxlciwgdGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpO1xuXHRcdHRoaXMuYm90cy5mb3JFYWNoKGJvdCA9PiBib3QudXBkYXRlKHRoaXMsIHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyLCBtb25zdGVyS25vd2xlZGdlKSk7XG5cdFx0dGhpcy5tb25zdGVycy5mb3JFYWNoKChtb25zdGVyLCBpdGVtKSA9PiB7XG5cdFx0XHRpZiAobW9uc3Rlci5oZWFsdGguaXNFbXB0eSgpKSB7XG5cdFx0XHRcdHRoaXMubW9uc3RlcnMucmVtb3ZlKGl0ZW0pO1xuXHRcdFx0XHRtb25zdGVyLnJlbW92ZUludGVyc2VjdGlvbkJvdW5kcyh0aGlzLmludGVyc2VjdGlvbkZpbmRlcik7XG5cdFx0XHR9IGVsc2Vcblx0XHRcdFx0bW9uc3Rlci51cGRhdGUodGhpcywgdGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIsIG1vbnN0ZXJLbm93bGVkZ2UpO1xuXHRcdH0pO1xuXHRcdHRoaXMucHJvamVjdGlsZXMuZm9yRWFjaCgocHJvamVjdGlsZSwgaXRlbSkgPT4ge1xuXHRcdFx0aWYgKHByb2plY3RpbGUudXBkYXRlKHRoaXMsIHRoaXMuaW50ZXJzZWN0aW9uRmluZGVyKSkge1xuXHRcdFx0XHR0aGlzLnByb2plY3RpbGVzLnJlbW92ZShpdGVtKTtcblx0XHRcdFx0cHJvamVjdGlsZS5yZW1vdmVJbnRlcnNlY3Rpb25Cb3VuZHModGhpcy5pbnRlcnNlY3Rpb25GaW5kZXIpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHRoaXMucGFydGljbGVzLmZvckVhY2goKHBhcnRpY2xlLCBpdGVtKSA9PiB7XG5cdFx0XHRpZiAocGFydGljbGUudXBkYXRlKCkpXG5cdFx0XHRcdHRoaXMucGFydGljbGVzLnJlbW92ZShpdGVtKTtcblx0XHR9KTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdHRoaXMuc3RpbGxzLmZvckVhY2goc3RpbGwgPT4gc3RpbGwucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5wbGF5ZXIucGFpbnQocGFpbnRlciwgY2FtZXJhKTtcblx0XHR0aGlzLmJvdEhlcm9lcy5mb3JFYWNoKGJvdEhlcm8gPT4gYm90SGVyby5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0XHR0aGlzLm1vbnN0ZXJzLmZvckVhY2gobW9uc3RlciA9PiBtb25zdGVyLnBhaW50KHBhaW50ZXIsIGNhbWVyYSkpO1xuXHRcdHRoaXMucHJvamVjdGlsZXMuZm9yRWFjaChwcm9qZWN0aWxlID0+IHByb2plY3RpbGUucGFpbnQocGFpbnRlciwgY2FtZXJhKSk7XG5cdFx0dGhpcy5wYXJ0aWNsZXMuZm9yRWFjaChwYXJ0aWNsZSA9PiBwYXJ0aWNsZS5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0fVxuXG5cdHBhaW50VWkocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0dGhpcy51aXMuZm9yRWFjaCgodWksIGl0ZXIpID0+IHtcblx0XHRcdGlmICh1aS5yZW1vdmVVaSgpKVxuXHRcdFx0XHR0aGlzLnVpcy5yZW1vdmUoaXRlcik7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHVpLnBhaW50VWkocGFpbnRlciwgY2FtZXJhKTtcblx0XHR9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1hcDtcblxuLy8gdG9kbyBbbWVkaXVtXSBjb25zaWRlciBzdGF0aWMgJiBkeW5hbWljIGVudGl0eSBsaXN0cyBpbiBzdGVhZCBvZiBpbmRpdmlkdWFsIHR5cGUgZW50aXR5IGxpc3RzXG4iLCJjb25zdCB7UG9zaXRpb25zfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IHtyb3VuZH0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XHJcblxyXG5jbGFzcyBNYXBHZW5lcmF0b3Ige1xyXG5cdGNvbnN0cnVjdG9yKG1hcCkge1xyXG5cdFx0dGhpcy5tYXAgPSBtYXA7XHJcblx0XHR0aGlzLnRpbWVyID0gMDtcclxuXHRcdC8vIG11c3QgY3JlYXRlIHBsYXllclxyXG5cdH1cclxuXHJcblx0dXBkYXRlKCkge1xyXG5cdFx0dGhpcy50aW1lcisrO1xyXG5cdH1cclxuXHJcblx0cmVtb3ZlVWkoKSB7XHJcblx0XHRyZXR1cm4gZmFsc2U7XHJcblx0fVxyXG5cclxuXHRwYWludFVpKHBhaW50ZXIsIGNhbWVyYSkge1xyXG5cdFx0bGV0IGZvbnQgPSB7c2l6ZTogJzE2cHgnLCBhbGlnbjogJ3JpZ2h0J307XHJcblx0XHRwYWludGVyLmFkZChuZXcgVGV4dChcclxuXHRcdFx0MSAtIFBvc2l0aW9ucy5NQVJHSU4sXHJcblx0XHRcdFBvc2l0aW9ucy5NQVJHSU4gKiAyICsgUG9zaXRpb25zLkJBUl9IRUlHSFQgKiAyLFxyXG5cdFx0XHRgJHtyb3VuZCh0aGlzLnRpbWVyIC8gMTAwKX1gLCBmb250KSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcEdlbmVyYXRvcjtcclxuIiwiY29uc3QgTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9NYXBHZW5lcmF0b3InKTtcclxuY29uc3QgVmVjdG9yID0gcmVxdWlyZSgnLi4vdXRpbC9WZWN0b3InKTtcclxuY29uc3Qge05vaXNlU2ltcGxleH0gPSByZXF1aXJlKCcuLi91dGlsL05vaXNlJyk7XHJcbmNvbnN0IHtyYW5kLCByYW5kSW50LCBmbG9vciwgcm91bmR9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcclxuY29uc3QgTWFwQm91bmRhcnkgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9zdGlsbHMvTWFwQm91bmRhcnknKTtcclxuY29uc3QgUm9jayA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3N0aWxscy9Sb2NrJyk7XHJcbmNvbnN0IFJvY2tNaW5lcmFsID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvc3RpbGxzL1JvY2tNaW5lcmFsJyk7XHJcbmNvbnN0IEVnZyA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3N0aWxscy9FZ2cnKTtcclxuY29uc3QgUHJvamVjdGlsZUF0dGFjayA9IHJlcXVpcmUoJy4uL2FiaWxpdGllcy9Qcm9qZWN0aWxlQXR0YWNrJyk7XHJcbmNvbnN0IERhc2ggPSByZXF1aXJlKCcuLi9hYmlsaXRpZXMvRGFzaCcpO1xyXG5jb25zdCBJbmNEZWZlbnNlID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0luY0RlZmVuc2UnKTtcclxuY29uc3QgRGVsYXllZFJlZ2VuID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL0RlbGF5ZWRSZWdlbicpO1xyXG5jb25zdCBSZXNwYXduID0gcmVxdWlyZSgnLi4vYWJpbGl0aWVzL1Jlc3Bhd24nKTtcclxuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBQbGF5ZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9oZXJvZXMvUGxheWVyJyk7XHJcbmNvbnN0IEJvdEhlcm8gPSByZXF1aXJlKCcuLi9lbnRpdGllcy9oZXJvZXMvQm90SGVybycpO1xyXG5jb25zdCBWU2hpcCA9IHJlcXVpcmUoJy4uL2dyYXBoaWNzL1ZTaGlwJyk7XHJcbmNvbnN0IFdTaGlwID0gcmVxdWlyZSgnLi4vZ3JhcGhpY3MvV1NoaXAnKTtcclxuY29uc3QgRWdnQm90ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvYm90L0VnZ0JvdCcpO1xyXG5jb25zdCB7UG9zaXRpb25zfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XHJcbmNvbnN0IFRleHQgPSByZXF1aXJlKCcuLi9wYWludGVyL1RleHQnKTtcclxuXHJcbmNvbnN0IFdJRFRIID0gMi41LCBIRUlHSFQgPSAyLjU7XHJcbmNvbnN0IFNQQVdOX1gxID0gV0lEVEggLyA1O1xyXG5jb25zdCBTUEFXTl9YMiA9IFdJRFRIIC0gU1BBV05fWDE7XHJcbmNvbnN0IENFTlRFUl9WID0gbmV3IFZlY3RvcihXSURUSCAvIDIsIEhFSUdIVCAvIDIpO1xyXG5jb25zdCBDRU5URVJfVl9NQUcgPSBDRU5URVJfVi5tYWduaXR1ZGU7IC8vIHRvZG8gW2xvd10gY2FjaGUgdmVjdG9yIGNhbGN1bGF0aW9ucyBhbmQgcmVtb3ZlIHRoaXMgcHJlLWNvbXB1dGF0aW9uXHJcblxyXG5jbGFzcyBNYXBHZW5lcmF0b3JFZ2cgZXh0ZW5kcyBNYXBHZW5lcmF0b3Ige1xyXG5cdGNvbnN0cnVjdG9yKG1hcCkge1xyXG5cdFx0c3VwZXIobWFwKTtcclxuXHJcblx0XHR0aGlzLnJvY2tOb2lzZSA9IG5ldyBOb2lzZVNpbXBsZXgoNSk7XHJcblxyXG5cdFx0bWFwLnNldFNpemUoV0lEVEgsIEhFSUdIVCk7XHJcblxyXG5cdFx0dGhpcy5nZW5lcmF0ZUJvdW5kYXJpZXMoKTtcclxuXHRcdHRoaXMuZ2VuZXJhdGVSb2NrcygpO1xyXG5cclxuXHRcdHRoaXMuZ2VuZXJhdGVFZ2coKTtcclxuXHRcdHRoaXMuZ2VuZXJhdGVCb3QoKTtcclxuXHJcblx0XHRtYXAuYWRkUGxheWVyKHRoaXMucGxheWVyKTtcclxuXHRcdG1hcC5hZGRVaSh0aGlzKTtcclxuXHJcblx0XHR0aGlzLnNjb3JlcyA9IFswLCAwXTtcclxuXHRcdHRoaXMud2luID0gLTE7XHJcblx0fVxyXG5cclxuXHRnZW5lcmF0ZUJvdW5kYXJpZXMoKSB7XHJcblx0XHRNYXBCb3VuZGFyeS5jcmVhdGVCb3hCb3VuZGFyaWVzKFdJRFRILCBIRUlHSFQpLmZvckVhY2gobWFwQm91bmRhcnkgPT4gdGhpcy5tYXAuYWRkU3RpbGwobWFwQm91bmRhcnkpKTtcclxuXHR9XHJcblxyXG5cdGdlbmVyYXRlUm9ja3MoKSB7XHJcblx0XHRjb25zdCBST0NLUyA9IDQsIFJPQ0tfTUlORVJBTFMgPSAwO1xyXG5cdFx0Y29uc3QgUk9DS19NQVhfU0laRSA9IC4zO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tTLCBXSURUSCwgSEVJR0hUKS5mb3JFYWNoKHBvc2l0aW9uID0+IHRoaXMubWFwLmFkZFN0aWxsKG5ldyBSb2NrKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tfTUlORVJBTFMsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gdGhpcy5tYXAuYWRkU3RpbGwobmV3IFJvY2tNaW5lcmFsKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdH1cclxuXHJcblx0Z2VuZXJhdGVFZ2coKSB7XHJcblx0XHRsZXQgbiA9IDQ7XHJcblx0XHR0aGlzLmVnZyA9IG5ldyBFZ2coW3t4OiBXSURUSCAvIDIsIHk6IEhFSUdIVCAvIG59LCB7eDogV0lEVEggLyAyLCB5OiBIRUlHSFQgKiAoMSAtIDEgLyBuKX1dKTtcclxuXHRcdHRoaXMubWFwLmFkZFN0aWxsKHRoaXMuZWdnKTtcclxuXHR9XHJcblxyXG5cdGdlbmVyYXRlQm90KCkge1xyXG5cdFx0bGV0IGNvb3BCb3RzID0gMTtcclxuXHRcdGxldCBob3N0aWxlQm90cyA9IDI7XHJcblx0XHRsZXQgcGxheWVySW5kZXggPSByYW5kSW50KGNvb3BCb3RzICsgMSk7XHJcblx0XHR0aGlzLnBsYXllciA9IE1hcEdlbmVyYXRvckVnZy5nZW5lcmF0ZVBsYXllcihTUEFXTl9YMSwgKHBsYXllckluZGV4ICsgMSkgLyAoY29vcEJvdHMgKyAyKSAqIEhFSUdIVCk7XHJcblx0XHRsZXQgY29vcEJvdEhlcm9lcyA9IFsuLi5BcnJheShjb29wQm90cyldLm1hcCgoXywgaSwgYSkgPT4gTWFwR2VuZXJhdG9yRWdnLmdlbmVyYXRlQm90SGVybyhTUEFXTl9YMSwgKGkgKyAxICsgKGkgPj0gcGxheWVySW5kZXgpKSAvIChhLmxlbmd0aCArIDIpICogSEVJR0hULCB0cnVlKSk7XHJcblx0XHRsZXQgaG9zdGlsZUJvdEhlcm9lcyA9IFsuLi5BcnJheShob3N0aWxlQm90cyldLm1hcCgoXywgaSwgYSkgPT4gTWFwR2VuZXJhdG9yRWdnLmdlbmVyYXRlQm90SGVybyhTUEFXTl9YMiwgKGkgKyAxKSAvIChhLmxlbmd0aCArIDEpICogSEVJR0hULCBmYWxzZSkpO1xyXG5cdFx0bGV0IGJvdCA9IG5ldyBFZ2dCb3QodGhpcy5wbGF5ZXIsIGNvb3BCb3RIZXJvZXMsIGhvc3RpbGVCb3RIZXJvZXMsIHRoaXMuZWdnLCBDRU5URVJfVik7XHJcblx0XHR0aGlzLm1hcC5hZGRCb3QoYm90KTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBnZW5lcmF0ZUhlcm9BYmlsaXRpZXMoeCwgeSkge1xyXG5cdFx0bGV0IGFiaWxpdGllcyA9IFtcclxuXHRcdFx0bmV3IFByb2plY3RpbGVBdHRhY2soKSxcclxuXHRcdFx0bmV3IERhc2goKSxcclxuXHRcdFx0bmV3IEluY0RlZmVuc2UoKSxcclxuXHRcdF07XHJcblx0XHRhYmlsaXRpZXMuZm9yRWFjaCgoYWJpbGl0eSwgaSkgPT4gYWJpbGl0eS5zZXRVaShpKSk7IC8vIHNvbWUgYWJpbGl0aWVzIGdpdmUgYnVmZnMgd2hpY2ggcmVxdWlyZSBVSSBjb2xvcnMgdG8gYmUgc2V0XHJcblx0XHRsZXQgcGFzc2l2ZUFiaWxpdGllcyA9IFtcclxuXHRcdFx0bmV3IERlbGF5ZWRSZWdlbigpLFxyXG5cdFx0XHRuZXcgUmVzcGF3bigyNDAsIHgsIHkpLFxyXG5cdFx0XTtcclxuXHRcdHJldHVybiB7YWJpbGl0aWVzLCBwYXNzaXZlQWJpbGl0aWVzfTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBnZW5lcmF0ZVBsYXllcih4LCB5KSB7XHJcblx0XHRsZXQge2FiaWxpdGllcywgcGFzc2l2ZUFiaWxpdGllc30gPSBNYXBHZW5lcmF0b3JFZ2cuZ2VuZXJhdGVIZXJvQWJpbGl0aWVzKHgsIHkpO1xyXG5cdFx0YWJpbGl0aWVzLmZvckVhY2goKGFiaWxpdHksIGkpID0+IGFiaWxpdHkuc2V0VWkoaSkpO1xyXG5cdFx0bGV0IHBheWVyID0gbmV3IFBsYXllcih4LCB5LCAuMDUsIC4wNSwgMSwgODAsIC4xMywgdHJ1ZSwgYWJpbGl0aWVzLCBwYXNzaXZlQWJpbGl0aWVzLCBDb2xvcnMuTElGRSwgQ29sb3JzLlNUQU1JTkEpO1xyXG5cdFx0cGF5ZXIuc2V0R3JhcGhpY3MobmV3IFZTaGlwKC4wNSwgLjA1LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5FbnRpdHkuUExBWUVSX0dSRUVOLmdldCgpfSkpO1xyXG5cdFx0cmV0dXJuIHBheWVyO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGdlbmVyYXRlQm90SGVybyh4LCB5LCBmcmllbmRseSkge1xyXG5cdFx0bGV0IHthYmlsaXRpZXMsIHBhc3NpdmVBYmlsaXRpZXN9ID0gTWFwR2VuZXJhdG9yRWdnLmdlbmVyYXRlSGVyb0FiaWxpdGllcyh4LCB5KTtcclxuXHRcdGxldCBib3RIZXJvID0gbmV3IEJvdEhlcm8oeCwgeSwgLjA1LCAuMDUsIDEsIDgwLCAuMTMsIGZyaWVuZGx5LCBhYmlsaXRpZXMsIHBhc3NpdmVBYmlsaXRpZXMsIENvbG9ycy5MSUZFLCBDb2xvcnMuU1RBTUlOQSk7XHJcblx0XHRib3RIZXJvLnNldEdyYXBoaWNzKG5ldyBWU2hpcCguMDUsIC4wNSwge2ZpbGw6IHRydWUsIGNvbG9yOiBmcmllbmRseSA/IENvbG9ycy5FbnRpdHkuRlJJRU5ETFkuZ2V0KCkgOiBDb2xvcnMuRW50aXR5Lk1PTlNURVIuZ2V0KCl9KSk7XHJcblx0XHRyZXR1cm4gYm90SGVybztcclxuXHR9XHJcblxyXG5cdHVwZGF0ZSgpIHtcclxuXHRcdGlmICh0aGlzLndpbiAhPT0gLTEpXHJcblx0XHRcdHJldHVybjtcclxuXHRcdHRoaXMudGltZXIrKztcclxuXHRcdGlmICghdGhpcy5lZ2cub3duZXJIZXJvKVxyXG5cdFx0XHRyZXR1cm47XHJcblx0XHRsZXQgc2NvcmVJID0gdGhpcy5lZ2cub3duZXJIZXJvLmZyaWVuZGx5ID8gMCA6IDE7XHJcblx0XHRsZXQgc2NvcmVJbmMgPSAxIC0gVmVjdG9yLmZyb21PYmoodGhpcy5lZ2cub3duZXJIZXJvKS5zdWJ0cmFjdChDRU5URVJfVikubWFnbml0dWRlIC8gQ0VOVEVSX1ZfTUFHO1xyXG5cdFx0dGhpcy5zY29yZXNbc2NvcmVJXSArPSBzY29yZUluYztcclxuXHRcdGlmICh0aGlzLnNjb3Jlc1tzY29yZUldID49IDEwMDApXHJcblx0XHRcdHRoaXMud2luID0gc2NvcmVJO1xyXG5cdH1cclxuXHJcblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcclxuXHRcdGxldCBmb250ID0ge3NpemU6ICcxNnB4JywgYWxpZ246ICdyaWdodCd9O1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IFRleHQoXHJcblx0XHRcdDEgLSBQb3NpdGlvbnMuTUFSR0lOLCBQb3NpdGlvbnMuTUFSR0lOICogMiArIFBvc2l0aW9ucy5CQVJfSEVJR0hULFxyXG5cdFx0XHRgdGltZTogJHtyb3VuZCh0aGlzLnRpbWVyIC8gMTAwKX1gLCBmb250KSk7XHJcblx0XHRwYWludGVyLmFkZChuZXcgVGV4dChcclxuXHRcdFx0MSAtIFBvc2l0aW9ucy5NQVJHSU4sIFBvc2l0aW9ucy5NQVJHSU4gKiAzICsgUG9zaXRpb25zLkJBUl9IRUlHSFQgKiAyLFxyXG5cdFx0XHRgc2NvcmU6ICR7dGhpcy5zY29yZXMubWFwKHMgPT4gZmxvb3IocyAvIDEwMCkpLmpvaW4oJyB2ICcpfWAsIGZvbnQpKTtcclxuXHJcblx0XHRpZiAodGhpcy53aW4gIT09IC0xKVxyXG5cdFx0XHRwYWludGVyLmFkZChuZXcgVGV4dChcclxuXHRcdFx0XHQuNSwgLjQsXHJcblx0XHRcdFx0YCR7dGhpcy53aW4gPyAnUmVkJyA6ICdHcmVlbid9IFRlYW0gV2lucyFgLCB7c2l6ZTogJzI1cHgnLCBhbGlnbjogJ2NlbnRlcid9KSk7XHJcblx0fVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hcEdlbmVyYXRvckVnZztcclxuIiwiY29uc3QgTWFwR2VuZXJhdG9yID0gcmVxdWlyZSgnLi9NYXBHZW5lcmF0b3InKTtcclxuY29uc3Qge05vaXNlU2ltcGxleH0gPSByZXF1aXJlKCcuLi91dGlsL05vaXNlJyk7XHJcbmNvbnN0IFBsYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL2hlcm9lcy9QbGF5ZXInKTtcclxuY29uc3Qge3JhbmQsIHJvdW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XHJcbmNvbnN0IE1hcEJvdW5kYXJ5ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvc3RpbGxzL01hcEJvdW5kYXJ5Jyk7XHJcbmNvbnN0IFJvY2sgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9zdGlsbHMvUm9jaycpO1xyXG5jb25zdCBSb2NrTWluZXJhbCA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3N0aWxscy9Sb2NrTWluZXJhbCcpO1xyXG5jb25zdCBDaGFtcGlvbiA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL0NoYW1waW9uJyk7XHJcbmNvbnN0IEV4cGxvZGluZ1RpY2sgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9FeHBsb2RpbmdUaWNrJyk7XHJcbmNvbnN0IFNuaXBlclRpY2sgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9TbmlwZXJUaWNrJyk7XHJcbmNvbnN0IFN0YXRpYzREaXJUdXJyZXQgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9TdGF0aWM0RGlyVHVycmV0Jyk7XHJcbmNvbnN0IEFpbWluZ0xhc2VyVHVycmV0ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vQWltaW5nTGFzZXJUdXJyZXQnKTtcclxuY29uc3QgTWVjaGFuaWNhbEJvc3NFYXJseSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL01lY2hhbmljYWxCb3NzRWFybHknKTtcclxuY29uc3QgQm9tYkxheWVyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vQm9tYkxheWVyJyk7XHJcbmNvbnN0IERhc2hDaGFzZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9EYXNoQ2hhc2VyJyk7XHJcbmNvbnN0IE1lY2hhbmljYWxCb3NzID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vTWVjaGFuaWNhbEJvc3MnKTtcclxuY29uc3Qge1Bvc2l0aW9uc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xyXG5jb25zdCBUZXh0ID0gcmVxdWlyZSgnLi4vcGFpbnRlci9UZXh0Jyk7XHJcblxyXG5jb25zdCBXSURUSCA9IDEuNSwgSEVJR0hUID0gMS41O1xyXG5jb25zdCBTUEFXTl9ESVNUID0gMyAvIDQ7XHJcblxyXG5jb25zdCBTVEFHRV9TUEFXTlMgPSBbXHJcblx0Ly8gW1xyXG5cdC8vIFx0W01lY2hhbmljYWxCb3NzRWFybHksIDFdLFxyXG5cdC8vIF0sXHJcblx0Ly8gW1xyXG5cdC8vIFx0W01lY2hhbmljYWxCb3NzLCAxXSxcclxuXHQvLyBdLFxyXG5cdFtcclxuXHRcdFtFeHBsb2RpbmdUaWNrLCAzXSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtFeHBsb2RpbmdUaWNrLCAyXSxcclxuXHRcdFtTbmlwZXJUaWNrLCAyXSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtTdGF0aWM0RGlyVHVycmV0LCAzXSxcclxuXHRcdFtBaW1pbmdMYXNlclR1cnJldCwgMl0sXHJcblx0XSxcclxuXHRbXHJcblx0XHRbRXhwbG9kaW5nVGljaywgNF0sXHJcblx0XHRbU25pcGVyVGljaywgNF0sXHJcblx0XHRbU3RhdGljNERpclR1cnJldCwgMl0sXHJcblx0XSxcclxuXHRbXHJcblx0XHRbTWVjaGFuaWNhbEJvc3NFYXJseSwgMV0sXHJcblx0XSxcclxuXHRbXHJcblx0XHRbQm9tYkxheWVyLCAzXSxcclxuXHRcdFtEYXNoQ2hhc2VyLCA0XSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtBaW1pbmdMYXNlclR1cnJldCwgMl0sXHJcblx0XHRbQm9tYkxheWVyLCA0XSxcclxuXHRcdFtEYXNoQ2hhc2VyLCAzXSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtTbmlwZXJUaWNrLCAzXSxcclxuXHRcdFtTdGF0aWM0RGlyVHVycmV0LCAzXSxcclxuXHRcdFtBaW1pbmdMYXNlclR1cnJldCwgM10sXHJcblx0XHRbQm9tYkxheWVyLCAzXSxcclxuXHRcdFtEYXNoQ2hhc2VyLCAzXSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtFeHBsb2RpbmdUaWNrLCA0XSxcclxuXHRcdFtTbmlwZXJUaWNrLCA0XSxcclxuXHRcdFtTdGF0aWM0RGlyVHVycmV0LCA0XSxcclxuXHRcdFtBaW1pbmdMYXNlclR1cnJldCwgNF0sXHJcblx0XHRbQm9tYkxheWVyLCA0XSxcclxuXHRcdFtEYXNoQ2hhc2VyLCA0XSxcclxuXHRdLFxyXG5cdFtcclxuXHRcdFtNZWNoYW5pY2FsQm9zcywgMV0sXHJcblx0XSxcclxuXHRbXHJcblx0XHRbRXhwbG9kaW5nVGljaywgNF0sXHJcblx0XHRbU25pcGVyVGljaywgNF0sXHJcblx0XHRbU3RhdGljNERpclR1cnJldCwgNF0sXHJcblx0XHRbQWltaW5nTGFzZXJUdXJyZXQsIDRdLFxyXG5cdFx0W0JvbWJMYXllciwgNF0sXHJcblx0XHRbRGFzaENoYXNlciwgNF0sXHJcblx0XSxcclxuXTtcclxuXHJcbmNsYXNzIE1hcEdlbmVyYXRvclN0YWdlZCBleHRlbmRzIE1hcEdlbmVyYXRvciB7XHJcblx0Y29uc3RydWN0b3IobWFwKSB7XHJcblx0XHRzdXBlcihtYXApO1xyXG5cclxuXHRcdHRoaXMub2NjdXBpZWROb2lzZSA9IG5ldyBOb2lzZVNpbXBsZXgoMik7XHJcblx0XHR0aGlzLnJvY2tOb2lzZSA9IG5ldyBOb2lzZVNpbXBsZXgoNSk7XHJcblxyXG5cdFx0bWFwLnNldFNpemUoV0lEVEgsIEhFSUdIVCk7XHJcblxyXG5cdFx0dGhpcy5nZW5lcmF0ZUJvdW5kYXJpZXMoKTtcclxuXHRcdHRoaXMuZ2VuZXJhdGVSb2NrcygpO1xyXG5cclxuXHRcdHRoaXMuc3RhZ2VFbnRpdGllcyA9IFtdO1xyXG5cdFx0dGhpcy5zdGFnZSA9IDA7XHJcblxyXG5cdFx0dGhpcy5wbGF5ZXIgPSBQbGF5ZXIuZGVmYXVsdENvbnN0cnVjdG9yKCk7XHJcblx0XHR0aGlzLnBsYXllci5zZXRQb3NpdGlvbihXSURUSCAqIFNQQVdOX0RJU1QsIEhFSUdIVCAqIFNQQVdOX0RJU1QpO1xyXG5cdFx0bWFwLmFkZFBsYXllcih0aGlzLnBsYXllcik7XHJcblx0XHRtYXAuYWRkVWkodGhpcyk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUoKSB7XHJcblx0XHRzdXBlci51ZHBhdGUoKTtcclxuXHRcdGlmICh0aGlzLnN0YWdlRW50aXRpZXMuZXZlcnkoZW50aXR5ID0+IGVudGl0eS5oZWFsdGguaXNFbXB0eSgpKSkge1xyXG5cdFx0XHRsZXQgZW50aXRpZXMgPSB0aGlzLmNyZWF0ZU1vbnN0ZXJzKHRoaXMuc3RhZ2UrKyk7XHJcblx0XHRcdGVudGl0aWVzLmZvckVhY2goKFtlbnRpdHksIHVpXSkgPT4ge1xyXG5cdFx0XHRcdHdoaWxlICghZW50aXR5LmNoZWNrUG9zaXRpb24odGhpcy5tYXAuaW50ZXJzZWN0aW9uRmluZGVyKSkge1xyXG5cdFx0XHRcdFx0bGV0IHBvc2l0aW9uID0gdGhpcy5vY2N1cGllZE5vaXNlLnBvc2l0aW9ucygxLCBXSURUSCwgSEVJR0hUKVswXTtcclxuXHRcdFx0XHRcdGVudGl0eS5zZXRQb3NpdGlvbiguLi5wb3NpdGlvbik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHRoaXMubWFwLmFkZE1vbnN0ZXIoZW50aXR5LCB1aSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHR0aGlzLnBsYXllci5yZXN0b3JlSGVhbHRoKCk7XHJcblx0XHRcdHRoaXMuc3RhZ2VFbnRpdGllcyA9IGVudGl0aWVzLm1hcCgoW2VudGl0eV0pID0+IGVudGl0eSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZW5lcmF0ZUJvdW5kYXJpZXMoKSB7XHJcblx0XHRNYXBCb3VuZGFyeS5jcmVhdGVCb3hCb3VuZGFyaWVzKFdJRFRILCBIRUlHSFQpLmZvckVhY2gobWFwQm91bmRhcnkgPT4gdGhpcy5tYXAuYWRkU3RpbGwobWFwQm91bmRhcnkpKTtcclxuXHR9XHJcblxyXG5cdGdlbmVyYXRlUm9ja3MoKSB7XHJcblx0XHRjb25zdCBST0NLUyA9IDMsIFJPQ0tfTUlORVJBTFMgPSAxO1xyXG5cdFx0Y29uc3QgUk9DS19NQVhfU0laRSA9IC4zO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tTLCBXSURUSCwgSEVJR0hUKS5mb3JFYWNoKHBvc2l0aW9uID0+IHRoaXMubWFwLmFkZFN0aWxsKG5ldyBSb2NrKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tfTUlORVJBTFMsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gdGhpcy5tYXAuYWRkU3RpbGwobmV3IFJvY2tNaW5lcmFsKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdH1cclxuXHJcblx0Y3JlYXRlTW9uc3RlcnMoc3RhZ2UpIHtcclxuXHRcdGxldCBzcGF3bnMgPSBTVEFHRV9TUEFXTlNbTWF0aC5taW4oc3RhZ2UsIFNUQUdFX1NQQVdOUy5sZW5ndGggLSAxKV07XHJcblx0XHRsZXQgbXVsdGlwbGllciA9IE1hdGgubWF4KHN0YWdlIC0gU1RBR0VfU1BBV05TLmxlbmd0aCArIDIsIDEpO1xyXG5cdFx0cmV0dXJuIHNwYXducy5tYXAoKFtNb25zdGVyQ2xhc3MsIGNvdW50XSkgPT5cclxuXHRcdFx0Wy4uLkFycmF5KGNvdW50ICogbXVsdGlwbGllcildXHJcblx0XHRcdFx0Lm1hcCgoKSA9PiBbbmV3IE1vbnN0ZXJDbGFzcygpLCBmYWxzZV0pKVxyXG5cdFx0XHQuZmxhdCgpO1xyXG5cdH1cclxuXHJcblx0cGFpbnRVaShwYWludGVyLCBjYW1lcmEpIHtcclxuXHRcdGxldCBmb250ID0ge3NpemU6ICcxNnB4JywgYWxpZ246ICdyaWdodCd9O1xyXG5cdFx0cGFpbnRlci5hZGQobmV3IFRleHQoXHJcblx0XHRcdDEgLSBQb3NpdGlvbnMuTUFSR0lOLFxyXG5cdFx0XHRQb3NpdGlvbnMuTUFSR0lOICogMiArIFBvc2l0aW9ucy5CQVJfSEVJR0hUICogMixcclxuXHRcdFx0YCR7dGhpcy5zdGFnZX0gOiAke3JvdW5kKHRoaXMudGltZXIgLyAxMDApfWAsIGZvbnQpKTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFwR2VuZXJhdG9yU3RhZ2VkO1xyXG5cclxuLypcclxuMTIzNDU2XHJcblxyXG4xXHJcbjEyXHJcbjM0XHJcbjEyM1xyXG5cclxuNTZcclxuNDU2XHJcbjIzNDU2IC0gMVxyXG4xMjQzNTZcclxuXHJcbk9SXHJcbjEyMzQ1NlxyXG4xMjM0NTZcclxuMTIzNDU2XHJcbjEyMzQ1NlxyXG5cclxuMVxyXG4xMlxyXG4zNFxyXG4xMjNcclxuXHJcbjQ1NlxyXG4yMzU2XHJcbjI0NTZcclxuMTM0NTZcclxuXHJcbmV4cGxvZGluZyB0aWNrICAgICAgICAgIGRlZ2VuIHdoaWxlIG1vdmluZ1xyXG5zbmlwZXIgdGljayAgICAgICAgICAgICBzaG90IGxlYXZlcyB0ZW1wb3Jhcnkgc3BoZXJlcyBpbiB0cmFpbFxyXG5maXhlZCA0LXdheSB0dXJyZXQgICAgICBhbHRlcm5hdGVzIHRvIGRpYWdvbmFsXHJcbmFpbWluZyAxLXdheSB0dXJyZXQgICAgIHRyaXBsZSBsYXNlclxyXG5ib21iIGxheWVyXHJcbmNoYXJnZXJcclxuXHJcbm1lbGVlIGRhcnRcclxubWVsZWUgZGFydCBzcGF3bmVyIHNoaXBcclxuZGVnZW4gdHVycmV0IG9yIHR1cnJldCB3aXRoIHNwaW5uaW5nIGRlZ2VuIHRpbnkgbW9ic1xyXG50dXJyZXQgd2l0aCBzdGF0aWMgJiBpbmFjdGl2ZSB0aW55IG1vYnMsIHRoYXQgcGVyaW9kaWNhbGx5IGNoYXJnZSB0aGUgcGxheWVyIHdpdGggc2xvdyByb3RhdGlvblxyXG53YWxsIG9mIHByb2plY3RpbGVzXHJcbmZyb250YWwgZGVnZW4gcmVjdGFuZ2xlXHJcblxyXG5tZWxlZSBzbG93IGRlYnVmZlxyXG5yYW5nZWQgaGVhbCBhbGxpZXMgZGVidWZmXHJcbnNwaW5uaW5nIHR1cnJldFxyXG5kZWxheWVkIG1pc3NpbGUgdHVycmV0XHJcbmVuY2lyY2xpbmcgY2lyY2xlIGZvIGJvbWJzXHJcbnJhcGlkIGZpcmluZywgc2xvdyBtb3ZpbmcsIHNob3J0IHJhbmdlIHByb2plY3RpbGUgbWFjaGluZSBndW5cclxuXHJcbmdhbWUgbW9kZXM6IGRlZmVuc2UsIGJvc3MgZmlnaHRzLCBraWxsIG91dHBvc3QgcG9ydGFscywgYW5kIGFyZW5hXHJcbiovXHJcbiIsImNvbnN0IE1hcEdlbmVyYXRvciA9IHJlcXVpcmUoJy4vTWFwR2VuZXJhdG9yJyk7XHJcbmNvbnN0IHtOb2lzZVNpbXBsZXh9ID0gcmVxdWlyZSgnLi4vdXRpbC9Ob2lzZScpO1xyXG5jb25zdCBQbGF5ZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9oZXJvZXMvUGxheWVyJyk7XHJcbmNvbnN0IHtjbGFtcCwgcmFuZH0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xyXG5jb25zdCBNYXBCb3VuZGFyeSA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3N0aWxscy9NYXBCb3VuZGFyeScpO1xyXG5jb25zdCBSb2NrID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvc3RpbGxzL1JvY2snKTtcclxuY29uc3QgUm9ja01pbmVyYWwgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9zdGlsbHMvUm9ja01pbmVyYWwnKTtcclxuY29uc3QgQ2hhbXBpb24gPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9DaGFtcGlvbicpO1xyXG5jb25zdCBFeHBsb2RpbmdUaWNrID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vRXhwbG9kaW5nVGljaycpO1xyXG5jb25zdCBTbmlwZXJUaWNrID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vU25pcGVyVGljaycpO1xyXG5jb25zdCBTdGF0aWM0RGlyVHVycmV0ID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vU3RhdGljNERpclR1cnJldCcpO1xyXG5jb25zdCBBaW1pbmdMYXNlclR1cnJldCA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0FpbWluZ0xhc2VyVHVycmV0Jyk7XHJcbmNvbnN0IE1lY2hhbmljYWxCb3NzRWFybHkgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9tb25zdGVycy9tZWNoYW5pY2FsRmFjdGlvbi9NZWNoYW5pY2FsQm9zc0Vhcmx5Jyk7XHJcbmNvbnN0IEJvbWJMYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL0JvbWJMYXllcicpO1xyXG5jb25zdCBEYXNoQ2hhc2VyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvbW9uc3RlcnMvbWVjaGFuaWNhbEZhY3Rpb24vRGFzaENoYXNlcicpO1xyXG5jb25zdCBNZWNoYW5pY2FsQm9zcyA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL21vbnN0ZXJzL21lY2hhbmljYWxGYWN0aW9uL01lY2hhbmljYWxCb3NzJyk7XHJcblxyXG5jb25zdCBXSURUSCA9IDEuNSwgSEVJR0hUID0gMS41O1xyXG5jb25zdCBTUEFXTl9ESVNUID0gMyAvIDQ7XHJcblxyXG5jb25zdCBTUEFXTlMgPSBbXHJcblx0e1xyXG5cdFx0bW9uc3RlckNsYXNzOiBFeHBsb2RpbmdUaWNrLFxyXG5cdFx0cmFtcFN0YXJ0OiAyLFxyXG5cdFx0cmFtcEVuZDogMyxcclxuXHRcdHdlaWdodDogMzAsXHJcblx0fSxcclxuXHR7XHJcblx0XHRtb25zdGVyQ2xhc3M6IFNuaXBlclRpY2ssXHJcblx0XHRyYW1wU3RhcnQ6IDYsXHJcblx0XHRyYW1wRW5kOiAxMCxcclxuXHRcdHdlaWdodDogMjAsXHJcblx0fSxcclxuXHR7XHJcblx0XHRtb25zdGVyQ2xhc3M6IFN0YXRpYzREaXJUdXJyZXQsXHJcblx0XHRyYW1wU3RhcnQ6IDgsXHJcblx0XHRyYW1wRW5kOiAxMixcclxuXHRcdHdlaWdodDogMTAsXHJcblx0fSxcclxuXHR7XHJcblx0XHRtb25zdGVyQ2xhc3M6IEFpbWluZ0xhc2VyVHVycmV0LFxyXG5cdFx0cmFtcFN0YXJ0OiAxMCxcclxuXHRcdHJhbXBFbmQ6IDE0LFxyXG5cdFx0d2VpZ2h0OiAxMCxcclxuXHR9LFxyXG5cdHtcclxuXHRcdG1vbnN0ZXJDbGFzczogTWVjaGFuaWNhbEJvc3NFYXJseSxcclxuXHRcdHJhbXBTdGFydDogMTIsXHJcblx0XHRyYW1wRW5kOiAyMCxcclxuXHRcdHdlaWdodDogMSxcclxuXHR9LFxyXG5cdHtcclxuXHRcdG1vbnN0ZXJDbGFzczogQm9tYkxheWVyLFxyXG5cdFx0cmFtcFN0YXJ0OiAxNixcclxuXHRcdHJhbXBFbmQ6IDIwLFxyXG5cdFx0d2VpZ2h0OiAxMCxcclxuXHR9LFxyXG5cdHtcclxuXHRcdG1vbnN0ZXJDbGFzczogRGFzaENoYXNlcixcclxuXHRcdHJhbXBTdGFydDogMTgsXHJcblx0XHRyYW1wRW5kOiAyMixcclxuXHRcdHdlaWdodDogMTAsXHJcblx0fSxcclxuXHR7XHJcblx0XHRtb25zdGVyQ2xhc3M6IE1lY2hhbmljYWxCb3NzLFxyXG5cdFx0cmFtcFN0YXJ0OiAyMCxcclxuXHRcdHJhbXBFbmQ6IDI5LFxyXG5cdFx0d2VpZ2h0OiAuMyxcclxuXHR9LFxyXG5dO1xyXG5cclxuY2xhc3MgTWFwR2VuZXJhdG9yVGltZWQgZXh0ZW5kcyBNYXBHZW5lcmF0b3Ige1xyXG5cdGNvbnN0cnVjdG9yKG1hcCkge1xyXG5cdFx0c3VwZXIobWFwKTtcclxuXHJcblx0XHR0aGlzLm9jY3VwaWVkTm9pc2UgPSBuZXcgTm9pc2VTaW1wbGV4KDIpO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UgPSBuZXcgTm9pc2VTaW1wbGV4KDUpO1xyXG5cclxuXHRcdG1hcC5zZXRTaXplKFdJRFRILCBIRUlHSFQpO1xyXG5cclxuXHRcdHRoaXMuZ2VuZXJhdGVCb3VuZGFyaWVzKCk7XHJcblx0XHR0aGlzLmdlbmVyYXRlUm9ja3MoKTtcclxuXHJcblx0XHR0aGlzLndlaWdodEFjY3VtdWxhdGVkID0gMDtcclxuXHRcdHRoaXMucGVuZGluZ01vbnN0ZXJzID0gW107XHJcblxyXG5cdFx0dGhpcy5wbGF5ZXIgPSBQbGF5ZXIuZGVmYXVsdENvbnN0cnVjdG9yKCk7XHJcblx0XHR0aGlzLnBsYXllci5zZXRQb3NpdGlvbihXSURUSCAqIFNQQVdOX0RJU1QsIEhFSUdIVCAqIFNQQVdOX0RJU1QpO1xyXG5cdFx0bWFwLmFkZFBsYXllcih0aGlzLnBsYXllcik7XHJcblx0XHRtYXAuYWRkVWkodGhpcyk7XHJcblx0fVxyXG5cclxuXHR1cGRhdGUoKSB7XHJcblx0XHRzdXBlci51cGRhdGUoKTtcclxuXHRcdHRoaXMucGVuZGluZ01vbnN0ZXJzLnB1c2goLi4udGhpcy5jcmVhdGVNb25zdGVycygpKTtcclxuXHRcdHdoaWxlICh0aGlzLnBlbmRpbmdNb25zdGVycy5sZW5ndGgpIHtcclxuXHRcdFx0bGV0IFtlbnRpdHksIHVpXSA9IHRoaXMucGVuZGluZ01vbnN0ZXJzWzBdO1xyXG5cdFx0XHRsZXQgZm91bmRQb3NpdGlvbjtcclxuXHRcdFx0Zm9yIChsZXQgdHJ5SSA9IDA7IHRyeUkgPCAzICYmICFmb3VuZFBvc2l0aW9uOyB0cnlJKyspIHtcclxuXHRcdFx0XHRsZXQgcG9zaXRpb24gPSB0aGlzLm9jY3VwaWVkTm9pc2UucG9zaXRpb25zKDEsIFdJRFRILCBIRUlHSFQpWzBdO1xyXG5cdFx0XHRcdGVudGl0eS5zZXRQb3NpdGlvbiguLi5wb3NpdGlvbik7XHJcblx0XHRcdFx0Zm91bmRQb3NpdGlvbiA9IGVudGl0eS5jaGVja1Bvc2l0aW9uKHRoaXMubWFwLmludGVyc2VjdGlvbkZpbmRlcik7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKCFmb3VuZFBvc2l0aW9uKVxyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0dGhpcy5tYXAuYWRkTW9uc3RlcihlbnRpdHksIHVpKTtcclxuXHRcdFx0dGhpcy5wZW5kaW5nTW9uc3RlcnMucG9wKCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRnZW5lcmF0ZUJvdW5kYXJpZXMoKSB7XHJcblx0XHRNYXBCb3VuZGFyeS5jcmVhdGVCb3hCb3VuZGFyaWVzKFdJRFRILCBIRUlHSFQpLmZvckVhY2gobWFwQm91bmRhcnkgPT4gdGhpcy5tYXAuYWRkU3RpbGwobWFwQm91bmRhcnkpKTtcclxuXHR9XHJcblxyXG5cdGdlbmVyYXRlUm9ja3MoKSB7XHJcblx0XHRjb25zdCBST0NLUyA9IDMsIFJPQ0tfTUlORVJBTFMgPSAxO1xyXG5cdFx0Y29uc3QgUk9DS19NQVhfU0laRSA9IC4zO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tTLCBXSURUSCwgSEVJR0hUKS5mb3JFYWNoKHBvc2l0aW9uID0+IHRoaXMubWFwLmFkZFN0aWxsKG5ldyBSb2NrKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdFx0dGhpcy5yb2NrTm9pc2UucG9zaXRpb25zKFJPQ0tfTUlORVJBTFMsIFdJRFRILCBIRUlHSFQpLmZvckVhY2gocG9zaXRpb24gPT4gdGhpcy5tYXAuYWRkU3RpbGwobmV3IFJvY2tNaW5lcmFsKC4uLnBvc2l0aW9uLCByYW5kKFJPQ0tfTUFYX1NJWkUpKSkpO1xyXG5cdH1cclxuXHJcblx0Y3JlYXRlTW9uc3RlcnMoKSB7XHJcblx0XHRsZXQgc3RhZ2UgPSB0aGlzLnRpbWVyIC8gMTAwO1xyXG5cdFx0bGV0IHNwYXduRXZlcnkgPSAuOSAqKiAoc3RhZ2UgLyAxMCkgKiAyMDtcclxuXHRcdHRoaXMud2VpZ2h0QWNjdW11bGF0ZWQgKz0gcmFuZCgxIC8gc3Bhd25FdmVyeSk7XHJcblx0XHRsZXQgd2VpZ2h0cyA9IFNQQVdOUy5tYXAoc3Bhd24gPT5cclxuXHRcdFx0Y2xhbXAoKHN0YWdlIC0gc3Bhd24ucmFtcFN0YXJ0KSAvIChzcGF3bi5yYW1wRW5kIC0gc3Bhd24ucmFtcFN0YXJ0KSwgMCwgMSkgKiBzcGF3bi53ZWlnaHQpO1xyXG5cdFx0bGV0IHdlaWdodHNTdW0gPSB3ZWlnaHRzLnJlZHVjZSgoc3VtLCB3ZWlnaHQpID0+IHN1bSArIHdlaWdodCk7XHJcblx0XHRsZXQgc3Bhd25zID0gW107XHJcblx0XHR3aGlsZSAodGhpcy53ZWlnaHRBY2N1bXVsYXRlZCA+IDEpIHtcclxuXHRcdFx0dGhpcy53ZWlnaHRBY2N1bXVsYXRlZC0tO1xyXG5cdFx0XHRsZXQgc3Bhd25QaWNrID0gcmFuZCh3ZWlnaHRzU3VtKTtcclxuXHRcdFx0bGV0IHNwYXduSW5kZXggPSB3ZWlnaHRzLmZpbmRJbmRleCh3ZWlnaHQgPT4ge1xyXG5cdFx0XHRcdHNwYXduUGljayAtPSB3ZWlnaHQ7XHJcblx0XHRcdFx0cmV0dXJuIHNwYXduUGljayA8IDA7XHJcblx0XHRcdH0pO1xyXG5cdFx0XHRpZiAoc3Bhd25JbmRleCA+PSAwKVxyXG5cdFx0XHRcdHNwYXducy5wdXNoKFtuZXcgU1BBV05TW3NwYXduSW5kZXhdLm1vbnN0ZXJDbGFzcygpLCBmYWxzZV0pO1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIHNwYXducztcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gTWFwR2VuZXJhdG9yVGltZWQ7XHJcblxyXG4vKlxyXG4xMjM0NTZcclxuXHJcbjFcclxuMTJcclxuMzRcclxuMTIzXHJcblxyXG41NlxyXG40NTZcclxuMjM0NTYgLSAxXHJcbjEyNDM1NlxyXG5cclxuT1JcclxuMTIzNDU2XHJcbjEyMzQ1NlxyXG4xMjM0NTZcclxuMTIzNDU2XHJcblxyXG4xXHJcbjEyXHJcbjM0XHJcbjEyM1xyXG5cclxuNDU2XHJcbjIzNTZcclxuMjQ1NlxyXG4xMzQ1NlxyXG5cclxuZXhwbG9kaW5nIHRpY2sgICAgICAgICAgZGVnZW4gd2hpbGUgbW92aW5nXHJcbnNuaXBlciB0aWNrICAgICAgICAgICAgIHNob3QgbGVhdmVzIHRlbXBvcmFyeSBzcGhlcmVzIGluIHRyYWlsXHJcbmZpeGVkIDQtd2F5IHR1cnJldCAgICAgIGFsdGVybmF0ZXMgdG8gZGlhZ29uYWxcclxuYWltaW5nIDEtd2F5IHR1cnJldCAgICAgdHJpcGxlIGxhc2VyXHJcbmJvbWIgbGF5ZXJcclxuY2hhcmdlclxyXG5cclxubWVsZWUgZGFydFxyXG5tZWxlZSBkYXJ0IHNwYXduZXIgc2hpcFxyXG5kZWdlbiB0dXJyZXQgb3IgdHVycmV0IHdpdGggc3Bpbm5pbmcgZGVnZW4gdGlueSBtb2JzXHJcbnR1cnJldCB3aXRoIHN0YXRpYyAmIGluYWN0aXZlIHRpbnkgbW9icywgdGhhdCBwZXJpb2RpY2FsbHkgY2hhcmdlIHRoZSBwbGF5ZXIgd2l0aCBzbG93IHJvdGF0aW9uXHJcbndhbGwgb2YgcHJvamVjdGlsZXNcclxuZnJvbnRhbCBkZWdlbiByZWN0YW5nbGVcclxuXHJcbm1lbGVlIHNsb3cgZGVidWZmXHJcbnJhbmdlZCBoZWFsIGFsbGllcyBkZWJ1ZmZcclxuc3Bpbm5pbmcgdHVycmV0XHJcbmRlbGF5ZWQgbWlzc2lsZSB0dXJyZXRcclxuZW5jaXJjbGluZyBjaXJjbGUgZm8gYm9tYnNcclxucmFwaWQgZmlyaW5nLCBzbG93IG1vdmluZywgc2hvcnQgcmFuZ2UgcHJvamVjdGlsZSBtYWNoaW5lIGd1blxyXG5cclxuZ2FtZSBtb2RlczogZGVmZW5zZSwgYm9zcyBmaWdodHMsIGtpbGwgb3V0cG9zdCBwb3J0YWxzLCBhbmQgYXJlbmFcclxuKi9cclxuIiwiY29uc3QgS2V5bWFwcGluZyA9IHJlcXVpcmUoJy4uL2NvbnRyb2wvS2V5bWFwcGluZycpO1xuY29uc3QgQ2FtZXJhID0gcmVxdWlyZSgnLi4vY2FtZXJhL0NhbWVyYScpO1xuY29uc3Qge0NvbG9yc30gPSByZXF1aXJlKCcuLi91dGlsL0NvbnN0YW50cycpO1xuY29uc3QgUmVjdCA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdCcpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNsYXNzIE1pbmltYXAge1xuXHRjb25zdHJ1Y3RvcihtYXApIHtcblx0XHR0aGlzLm1hcCA9IG1hcDtcblx0fVxuXG5cdHRvZ2dsZVpvb20oKSB7XG5cdFx0dGhpcy56b29tID0gIXRoaXMuem9vbTtcblx0fVxuXG5cdHVwZGF0ZShjb250cm9sbGVyKSB7XG5cdFx0aWYgKEtleW1hcHBpbmcuZ2V0Q29udHJvbFN0YXRlKGNvbnRyb2xsZXIsIEtleW1hcHBpbmcuQ29udHJvbHMuTUlOSU1BUF9aT09NKS5wcmVzc2VkKVxuXHRcdFx0dGhpcy50b2dnbGVab29tKCk7XG5cdH1cblxuXHRjcmVhdGVDYW1lcmEoKSB7XG5cdFx0Y29uc3QgT0ZGU0VUID0gLjAxLCBTQ0FMRV9CQVNFX1NNQUxMID0gLjE1LCBTQ0FMRV9CQVNFX0xBUkdFID0gLjQ7XG5cdFx0bGV0IHNjYWxlID0gKHRoaXMuem9vbSA/IFNDQUxFX0JBU0VfTEFSR0UgOiBTQ0FMRV9CQVNFX1NNQUxMKTtcblx0XHRyZXR1cm4gQ2FtZXJhLmNyZWF0ZUZvclJlZ2lvbih0aGlzLm1hcC53aWR0aCwgT0ZGU0VULCBPRkZTRVQsIHNjYWxlKTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIpIHtcblx0XHRsZXQgY2FtZXJhID0gdGhpcy5jcmVhdGVDYW1lcmEoKTtcblx0XHRwYWludGVyLmFkZChSZWN0LndpdGhDYW1lcmEoY2FtZXJhLCAwLCAwLCB0aGlzLm1hcC53aWR0aCwgdGhpcy5tYXAuaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IENvbG9ycy5NaW5pbWFwLkJBQ0tHUk9VTkQuZ2V0KCl9KSk7XG5cdFx0cGFpbnRlci5hZGQoUmVjdC53aXRoQ2FtZXJhKGNhbWVyYSwgMCwgMCwgdGhpcy5tYXAud2lkdGgsIHRoaXMubWFwLmhlaWdodCwge2ZpbGw6IGZhbHNlLCBjb2xvcjogQ29sb3JzLk1pbmltYXAuQk9SREVSLmdldCgpfSkpO1xuXHRcdHRoaXMubWFwLnN0aWxscy5mb3JFYWNoKHJvY2sgPT4gdGhpcy5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHJvY2sueCwgcm9jay55LCBDb2xvcnMuTWluaW1hcC5ST0NLLmdldCgpKSk7XG5cdFx0dGhpcy5tYXAubW9uc3RlcnMuZm9yRWFjaChtb25zdGVyID0+IHRoaXMucGFpbnREb3QocGFpbnRlciwgY2FtZXJhLCBtb25zdGVyLngsIG1vbnN0ZXIueSwgQ29sb3JzLk1pbmltYXAuTU9OU1RFUi5nZXQoKSkpO1xuXHRcdHRoaXMubWFwLnVpcy5mb3JFYWNoKHVpID0+IHRoaXMucGFpbnREb3QocGFpbnRlciwgY2FtZXJhLCB1aS54LCB1aS55LCBDb2xvcnMuTWluaW1hcC5CT1NTLmdldCgpKSk7XG5cdFx0dGhpcy5wYWludERvdChwYWludGVyLCBjYW1lcmEsIHRoaXMubWFwLnBsYXllci54LCB0aGlzLm1hcC5wbGF5ZXIueSwgQ29sb3JzLk1pbmltYXAuUExBWUVSLmdldCgpKTtcblx0fVxuXG5cdHBhaW50RG90KHBhaW50ZXIsIGNhbWVyYSwgeCwgeSwgY29sb3IpIHtcblx0XHRjb25zdCBET1RfU0laRSA9IC4wMiAqIHRoaXMubWFwLndpZHRoO1xuXHRcdHBhaW50ZXIuYWRkKFJlY3RDLndpdGhDYW1lcmEoY2FtZXJhLCB4LCB5LCBET1RfU0laRSwgRE9UX1NJWkUsIHtmaWxsOiB0cnVlLCBjb2xvcn0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1pbmltYXA7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcblxuY2xhc3MgQmFyIGV4dGVuZHMgUGFpbnRlckVsZW1lbnQge1xuXHRjb25zdHJ1Y3Rvcih4LCB5LCB3aWR0aCwgaGVpZ2h0LCBmaWxsUmF0aW8sIGVtcHR5Q29sb3IsIGZpbGxDb2xvciwgYm9yZGVyQ29sb3IpIHtcblx0XHRzdXBlcigpO1xuXHRcdHRoaXMuZW1wdHkgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGVtcHR5Q29sb3J9KTtcblx0XHR0aGlzLmZpbGwgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCAqIGZpbGxSYXRpbywgaGVpZ2h0LCB7ZmlsbDogdHJ1ZSwgY29sb3I6IGZpbGxDb2xvcn0pO1xuXHRcdHRoaXMuYm9yZGVyID0gbmV3IFJlY3QoeCwgeSwgd2lkdGgsIGhlaWdodCwge2NvbG9yOiBib3JkZXJDb2xvcn0pO1xuXHR9XG5cblx0cGFpbnQoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0dGhpcy5lbXB0eS5wYWludCh4dCwgeXQsIGNvbnRleHQpO1xuXHRcdHRoaXMuZmlsbC5wYWludCh4dCwgeXQsIGNvbnRleHQpO1xuXHRcdHRoaXMuYm9yZGVyLnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBCYXI7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcbmNvbnN0IFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcblxuY2xhc3MgQmFyQyBleHRlbmRzIFBhaW50ZXJFbGVtZW50IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwgZmlsbFJhdGlvLCBlbXB0eUNvbG9yLCBmaWxsQ29sb3IsIGJvcmRlckNvbG9yKSB7XG5cdFx0c3VwZXIoKTtcblx0XHR4IC09IHdpZHRoIC8gMjtcblx0XHR5IC09IGhlaWdodCAvIDI7XG5cdFx0dGhpcy5lbXB0eSA9IG5ldyBSZWN0KHgsIHksIHdpZHRoLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZW1wdHlDb2xvcn0pO1xuXHRcdHRoaXMuZmlsbCA9IG5ldyBSZWN0KHgsIHksIHdpZHRoICogZmlsbFJhdGlvLCBoZWlnaHQsIHtmaWxsOiB0cnVlLCBjb2xvcjogZmlsbENvbG9yfSk7XG5cdFx0dGhpcy5ib3JkZXIgPSBuZXcgUmVjdCh4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7Y29sb3I6IGJvcmRlckNvbG9yfSk7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHdpZHRoLCBoZWlnaHQsIGZpbGxSYXRpbywgZW1wdHlDb2xvciwgZmlsbENvbG9yLCBib3JkZXJDb2xvcikge1xuXHRcdHJldHVybiBuZXcgQmFyQyhjYW1lcmEueHQoeCksIGNhbWVyYS55dCh5KSwgY2FtZXJhLnN0KHdpZHRoKSwgY2FtZXJhLnN0KGhlaWdodCksIGZpbGxSYXRpbywgZW1wdHlDb2xvciwgZmlsbENvbG9yLCBib3JkZXJDb2xvcik7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHR0aGlzLmVtcHR5LnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5maWxsLnBhaW50KHh0LCB5dCwgY29udGV4dCk7XG5cdFx0dGhpcy5ib3JkZXIucGFpbnQoeHQsIHl0LCBjb250ZXh0KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEJhckM7XG4iLCJjb25zdCBQYXRoID0gcmVxdWlyZSgnLi9QYXRoJyk7XG5jb25zdCBWZWN0b3IgPSByZXF1aXJlKCcuLi91dGlsL1ZlY3RvcicpO1xuXG5jbGFzcyBMaW5lIGV4dGVuZHMgUGF0aCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHgyLCB5Miwgd2lkdGgsIGdyYXBoaWNPcHRpb25zKSB7XG5cdFx0bGV0IHcgPSBuZXcgVmVjdG9yKHgyIC0geCwgeTIgLSB5KS5yb3RhdGVCeUNvc1NpbigwLCAxKTtcblx0XHR3Lm1hZ25pdHVkZSA9IHdpZHRoO1xuXHRcdGxldCB4eXMgPSBbXG5cdFx0XHRbeCAtIHcueCwgeSAtIHcueV0sXG5cdFx0XHRbeCArIHcueCwgeSArIHcueV0sXG5cdFx0XHRbeDIgKyB3LngsIHkyICsgdy55XSxcblx0XHRcdFt4MiAtIHcueCwgeTIgLSB3LnldLFxuXHRcdF07XG5cdFx0c3VwZXIoeHlzLCB0cnVlLCBncmFwaGljT3B0aW9ucyk7XG5cdH1cblxuXHRzdGF0aWMgd2l0aENhbWVyYShjYW1lcmEsIHgsIHksIHgyLCB5Miwgd2lkdGgsIHtmaWxsLCBjb2xvciwgdGhpY2tuZXNzfSA9IHt9KSB7XG5cdFx0cmV0dXJuIG5ldyBMaW5lKGNhbWVyYS54dCh4KSwgY2FtZXJhLnl0KHkpLCBjYW1lcmEueHQoeDIpLCBjYW1lcmEueXQoeTIpLCBjYW1lcmEuc3Qod2lkdGgpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpbmU7XG4iLCJjbGFzcyBQYWludGVyIHtcblx0Y29uc3RydWN0b3Iod2lkdGgsIGhlaWdodCkge1xuXHRcdHRoaXMuY2FudmFzID0gUGFpbnRlci5jcmVhdGVDYW52YXMod2lkdGgsIGhlaWdodCk7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMueENvb3JkaW5hdGVUcmFuc2Zvcm0gPSB4ID0+IHggKiB3aWR0aDtcblx0XHR0aGlzLnlDb29yZGluYXRlVHJhbnNmb3JtID0geSA9PiB5ICogaGVpZ2h0O1xuXHRcdHRoaXMuY29udGV4dCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5zZXRGb250TW9kZSgpO1xuXHRcdHRoaXMuZWxlbWVudHMgPSBbXTsgLy8gdG9kbyBbbWVkaXVtXSB0ZXN0IGxpbmtlZCBsaXN0IGluc3RlYWQgb2YgYXJyYXkgZm9yIHBlcmZvcm1hbmNlXG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpIHtcblx0XHRsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7IC8vIHRvZG8gW2xvd10gYmV0dGVyIHdheSBvZiBjcmVhdGluZyBjb250ZXh0XG5cdFx0Y2FudmFzLndpZHRoID0gd2lkdGg7XG5cdFx0Y2FudmFzLmhlaWdodCA9IGhlaWdodDtcblx0XHRyZXR1cm4gY2FudmFzO1xuXHR9XG5cblx0c2V0Rm9udE1vZGUoKSB7XG5cdFx0dGhpcy5jb250ZXh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0dGhpcy5lbGVtZW50cyA9IFtdO1xuXHR9XG5cblx0YWRkKGVsZW1lbnQpIHtcblx0XHR0aGlzLmVsZW1lbnRzLnB1c2goZWxlbWVudCk7XG5cdH1cblxuXHRwYWludCgpIHtcblx0XHR0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblx0XHR0aGlzLmVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PlxuXHRcdFx0ZWxlbWVudC5wYWludCh0aGlzLnhDb29yZGluYXRlVHJhbnNmb3JtLCB0aGlzLnlDb29yZGluYXRlVHJhbnNmb3JtLCB0aGlzLmNvbnRleHQpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhaW50ZXI7XG4iLCJjb25zdCBQYWludGVyID0gcmVxdWlyZSgnLi9QYWludGVyJyk7XG5cbmNsYXNzIFBhaW50ZXJDb21wb3NpdG9yIHtcblx0Y29uc3RydWN0b3IoY2FudmFzKSB7XG5cdFx0dGhpcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcblx0XHR0aGlzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cdFx0dGhpcy5jb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cdFx0dGhpcy5wYWludGVyID0gbmV3IFBhaW50ZXIodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHRcdHRoaXMudWlQYWludGVyID0gbmV3IFBhaW50ZXIodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHR9XG5cblx0Y2xlYXIoKSB7XG5cdFx0dGhpcy5wYWludGVyLmNsZWFyKCk7XG5cdFx0dGhpcy51aVBhaW50ZXIuY2xlYXIoKTtcblx0fVxuXG5cdHBhaW50KCkge1xuXHRcdHRoaXMucGFpbnRlci5wYWludCgpO1xuXHRcdHRoaXMudWlQYWludGVyLnBhaW50KCk7XG5cblx0XHR0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gJ3doaXRlJztcblx0XHR0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHRcdHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodGhpcy5wYWludGVyLmNhbnZhcywgMCwgMCk7XG5cdFx0dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnVpUGFpbnRlci5jYW52YXMsIDAsIDApO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFpbnRlckNvbXBvc2l0b3I7XG4iLCJjb25zdCBDb2xvciA9IHJlcXVpcmUoJy4uL3V0aWwvQ29sb3InKTtcblxuY2xhc3MgUGFpbnRlckVsZW1lbnQge1xuXHRzZXRGaWxsTW9kZShjb250ZXh0KSB7XG5cdFx0Y29udGV4dC5maWxsU3R5bGUgPSB0aGlzLmNvbG9yO1xuXHR9XG5cblx0c2V0TGluZU1vZGUoY29udGV4dCkge1xuXHRcdGNvbnRleHQuc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9yO1xuXHRcdGNvbnRleHQubGluZVdpZHRoID0gdGhpcy50aGlja25lc3MgfHwgMTtcblx0fVxuXG5cdHNldERvdWJsZU1vZGUoY29udGV4dCkge1xuXHRcdGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBDb2xvci5mcm9tMSgwLCAwLCAwKS5nZXQoKTtcblx0XHRjb250ZXh0LmxpbmVXaWR0aCA9IDE7XG5cdH1cblxuXHRzZXRGb250KGNvbnRleHQpIHtcblx0XHRjb250ZXh0LnRleHRBbGlnbiA9IHRoaXMuYWxpZ247XG5cdFx0Y29udGV4dC5mb250ID0gYCR7dGhpcy5zaXplfSBtb25vc3BhY2VgO1xuXHR9XG5cblx0cGFpbnQocGFpbnRlcikge1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFpbnRlckVsZW1lbnQ7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcblxuY2xhc3MgUGF0aCBleHRlbmRzIFBhaW50ZXJFbGVtZW50IHtcblx0Y29uc3RydWN0b3IoeHlzLCBjbG9zZWQsIHtmaWxsLCBjb2xvciA9ICcjMDAwJywgdGhpY2tuZXNzID0gMX0gPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy54eXMgPSB4eXM7XG5cdFx0dGhpcy5jbG9zZWQgPSBjbG9zZWQ7XG5cdFx0dGhpcy5maWxsID0gZmlsbDtcblx0XHR0aGlzLmNvbG9yID0gY29sb3I7XG5cdFx0dGhpcy50aGlja25lc3MgPSB0aGlja25lc3M7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHRpZiAodGhpcy5maWxsKSB7XG5cdFx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdFx0dGhpcy5wYWludFBhdGgoeHQsIHl0LCBjb250ZXh0KTtcblx0XHRcdGNvbnRleHQuZmlsbCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnNldExpbmVNb2RlKGNvbnRleHQpO1xuXHRcdFx0dGhpcy5wYWludFBhdGgoeHQsIHl0LCBjb250ZXh0KTtcblx0XHRcdGNvbnRleHQuc3Ryb2tlKCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmZpbGwgPT09ICdkb3VibGUnKSB7XG5cdFx0XHR0aGlzLnNldERvdWJsZU1vZGUoY29udGV4dCk7XG5cdFx0XHR0aGlzLnBhaW50UGF0aCh4dCwgeXQsIGNvbnRleHQpO1xuXHRcdFx0Y29udGV4dC5zdHJva2UoKTtcblx0XHR9XG5cdH1cblxuXHRwYWludFBhdGgoeHQsIHl0LCBjb250ZXh0KSB7XG5cdFx0Y29udGV4dC5iZWdpblBhdGgoKTtcblx0XHRsZXQgeHl0ID0geHkgPT4gW3h0KHh5WzBdKSwgeXQoeHlbMV0pXTtcblx0XHRjb250ZXh0Lm1vdmVUbyguLi54eXQodGhpcy54eXNbMF0pKTtcblx0XHR0aGlzLnh5cy5mb3JFYWNoKHh5ID0+XG5cdFx0XHRjb250ZXh0LmxpbmVUbyguLi54eXQoeHkpKSk7XG5cdFx0aWYgKHRoaXMuY2xvc2VkKVxuXHRcdFx0Y29udGV4dC5jbG9zZVBhdGgoKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhdGg7XG4iLCJjb25zdCBQYWludGVyRWxlbWVudCA9IHJlcXVpcmUoJy4vUGFpbnRlckVsZW1lbnQnKTtcblxuY2xhc3MgUmVjdCBleHRlbmRzIFBhaW50ZXJFbGVtZW50IHtcblx0Y29uc3RydWN0b3IoeCwgeSwgd2lkdGgsIGhlaWdodCwge2ZpbGwsIGNvbG9yID0gJyMwMDAnLCB0aGlja25lc3MgPSAxfSA9IHt9KSB7XG5cdFx0c3VwZXIoKTtcblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXHRcdHRoaXMuZmlsbCA9IGZpbGw7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMudGhpY2tuZXNzID0gdGhpY2tuZXNzO1xuXHR9XG5cblx0c3RhdGljIHdpdGhDYW1lcmEoY2FtZXJhLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzcyA9IDF9ID0ge30pIHtcblx0XHRyZXR1cm4gbmV3IFJlY3QoY2FtZXJhLnh0KHgpLCBjYW1lcmEueXQoeSksIGNhbWVyYS5zdCh3aWR0aCksIGNhbWVyYS5zdChoZWlnaHQpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxuXG5cdHBhaW50KHh0LCB5dCwgY29udGV4dCkge1xuXHRcdGxldCB0eCA9IHh0KHRoaXMueCk7XG5cdFx0bGV0IHR5ID0geXQodGhpcy55KTtcblx0XHRsZXQgdFdpZHRoID0geHQodGhpcy53aWR0aCk7XG5cdFx0bGV0IHRIZWlnaHQgPSB4dCh0aGlzLmhlaWdodCk7XG5cblx0XHRpZiAodGhpcy5maWxsKSB7XG5cdFx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdFx0Y29udGV4dC5maWxsUmVjdCh0eCwgdHksIHRXaWR0aCwgdEhlaWdodCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuc2V0TGluZU1vZGUoY29udGV4dCk7XG5cdFx0XHRjb250ZXh0LnN0cm9rZVJlY3QodHgsIHR5LCB0V2lkdGgsIHRIZWlnaHQpO1xuXHRcdH1cblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3Q7XG4iLCJjb25zdCBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0Jyk7XG5cbmNsYXNzIFJlY3RDIGV4dGVuZHMgUmVjdCB7XG5cdC8vIHRvZG8gW2xvd10gcmVmYWN0b3IgY29vcmRpbmF0ZSBzeXN0ZW0gdG8gc3VwcG9ydCBjb29yZGludGFlcywgY2VudGVyZWQgY29vcmRpbnRhZXMsIGFuZCBjYW1lcmEgY29vcmRpbnRhZXMgdG8gcmVwbGFjZSBjdXJyZW50IGNvbnN0cnVjdG9yIG92ZXJsb2FkaW5nXG5cdGNvbnN0cnVjdG9yKGNlbnRlclgsIGNlbnRlclksIHdpZHRoLCBoZWlnaHQsIGdyYXBoaWNPcHRpb25zID0ge30pIHtcblx0XHRzdXBlcihjZW50ZXJYIC0gd2lkdGggLyAyLCBjZW50ZXJZIC0gaGVpZ2h0IC8gMiwgd2lkdGgsIGhlaWdodCwgZ3JhcGhpY09wdGlvbnMpO1xuXHR9XG5cblx0c3RhdGljIHdpdGhDYW1lcmEoY2FtZXJhLCBjZW50ZXJYLCBjZW50ZXJZLCB3aWR0aCwgaGVpZ2h0LCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzc30gPSB7fSkge1xuXHRcdHJldHVybiBuZXcgUmVjdEMoY2FtZXJhLnh0KGNlbnRlclgpLCBjYW1lcmEueXQoY2VudGVyWSksIGNhbWVyYS5zdCh3aWR0aCksIGNhbWVyYS5zdChoZWlnaHQpLCB7ZmlsbCwgY29sb3IsIHRoaWNrbmVzczogY2FtZXJhLnN0KHRoaWNrbmVzcyl9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY3RDO1xuIiwiY29uc3QgUGFpbnRlckVsZW1lbnQgPSByZXF1aXJlKCcuL1BhaW50ZXJFbGVtZW50Jyk7XG5cbmNsYXNzIFRleHQgZXh0ZW5kcyBQYWludGVyRWxlbWVudCB7XG5cdGNvbnN0cnVjdG9yKHgsIHksIHRleHQsIHtjb2xvciA9ICcjMDAwJywgc2l6ZSA9ICcxOHB4JywgYWxpZ24gPSAnY2VudGVyJ30gPSB7fSkge1xuXHRcdHN1cGVyKCk7XG5cdFx0dGhpcy54ID0geDtcblx0XHR0aGlzLnkgPSB5O1xuXHRcdHRoaXMudGV4dCA9IHRleHQ7XG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yO1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5hbGlnbiA9IGFsaWduO1xuXHR9XG5cblx0c3RhdGljIHdpdGhDYW1lcmEoY2FtZXJhLCB4LCB5LCB0ZXh0LCB7Y29sb3IsIHNpemUsIGFsaWdufSA9IHt9KSB7XG5cdFx0cmV0dXJuIG5ldyBUZXh0KGNhbWVyYS54dCh4KSwgY2FtZXJhLnl0KHkpLCB0ZXh0LCB7Y29sb3IsIHNpemUsIGFsaWdufSk7XG5cdH1cblxuXHRwYWludCh4dCwgeXQsIGNvbnRleHQpIHtcblx0XHR0aGlzLnNldEZpbGxNb2RlKGNvbnRleHQpO1xuXHRcdHRoaXMuc2V0Rm9udChjb250ZXh0KTtcblxuXHRcdGxldCB0eCA9IHh0KHRoaXMueCk7XG5cdFx0bGV0IHR5ID0geXQodGhpcy55KTtcblx0XHRjb250ZXh0LmZpbGxUZXh0KHRoaXMudGV4dCwgdHgsIHR5KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHQ7XG4iLCJjb25zdCB7Q29sb3JzfSA9IHJlcXVpcmUoJy4uL3V0aWwvQ29uc3RhbnRzJyk7XG5jb25zdCB7cmFuZCwgcmFuZEludH0gPSByZXF1aXJlKCcuLi91dGlsL051bWJlcicpO1xuY29uc3QgUmVjdEMgPSByZXF1aXJlKCcuLi9wYWludGVyL1JlY3RDJyk7XG5cbmNvbnN0IEZMSUNLRVJfQ09MT1JfTVVMVCA9IC43O1xuY29uc3QgU1RBUl9DT0xPUl9BUlJBWSA9IFtcblx0W0NvbG9ycy5TdGFyLldISVRFLCBDb2xvcnMuU3Rhci5XSElURS5tdWx0aXBseShGTElDS0VSX0NPTE9SX01VTFQpXSxcblx0W0NvbG9ycy5TdGFyLkJMVUUsIENvbG9ycy5TdGFyLkJMVUUubXVsdGlwbHkoRkxJQ0tFUl9DT0xPUl9NVUxUKV1dO1xuXG5jbGFzcyBTdGFyIHtcblx0Y29uc3RydWN0b3IoeCwgeSwgeiwgc2l6ZSwgYmx1ZSkge1xuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLnogPSB6O1xuXHRcdHRoaXMuc2l6ZSA9IHNpemU7XG5cdFx0dGhpcy5ibHVlID0gYmx1ZTtcblx0fVxuXG5cdHBhaW50KHBhaW50ZXIsIGNhbWVyYSkge1xuXHRcdGNvbnN0IEZMSUNLRVJfUkFURSA9IC4wMDM7XG5cblx0XHRsZXQgeCA9IGNhbWVyYS54dCh0aGlzLngsIHRoaXMueik7XG5cdFx0bGV0IHkgPSBjYW1lcmEueXQodGhpcy55LCB0aGlzLnopO1xuXHRcdGxldCBzID0gY2FtZXJhLnN0KHRoaXMuc2l6ZSwgdGhpcy56KTtcblxuXHRcdGlmICh0aGlzLmZsaWNrZXIpXG5cdFx0XHR0aGlzLmZsaWNrZXItLTtcblx0XHRlbHNlIGlmIChyYW5kKCkgPCBGTElDS0VSX1JBVEUpXG5cdFx0XHR0aGlzLmZsaWNrZXIgPSByYW5kSW50KDc1KTtcblxuXHRcdGxldCBjb2xvciA9IFNUQVJfQ09MT1JfQVJSQVlbdGhpcy5ibHVlID8gMSA6IDBdW3RoaXMuZmxpY2tlciA/IDEgOiAwXTtcblx0XHRwYWludGVyLmFkZChuZXcgUmVjdEMoeCwgeSwgcywgcywge2ZpbGw6IHRydWUsIGNvbG9yOiBjb2xvci5nZXQoKX0pKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXI7XG4iLCJjb25zdCB7cmFuZCwgcmFuZEJ9ID0gcmVxdWlyZSgnLi4vdXRpbC9OdW1iZXInKTtcbmNvbnN0IFN0YXIgPSByZXF1aXJlKCcuL1N0YXInKTtcbmNvbnN0IFJlY3RDID0gcmVxdWlyZSgnLi4vcGFpbnRlci9SZWN0QycpO1xuXG5jbGFzcyBTdGFyZmllbGQge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBleHRyYSA9IDApIHtcblx0XHRjb25zdCBERVBUSCA9IDIwICsgZXh0cmEgKiAyMCwgRk9SV0FSRF9ERVBUSCA9IC44LFxuXHRcdFx0V0lEVEggPSB3aWR0aCAqIERFUFRILCBIRUlHSFQgPSBoZWlnaHQgKiBERVBUSCxcblx0XHRcdENPVU5UID0gV0lEVEggKiBIRUlHSFQsXG5cdFx0XHRTSVpFID0gLjA1ICsgZXh0cmEgKiAuMDUsIEJMVUVfUkFURSA9IC4wNTtcblxuXHRcdHRoaXMuc3RhcnMgPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IENPVU5UOyBpKyspIHtcblx0XHRcdGxldCB4ID0gcmFuZEIoV0lEVEgpO1xuXHRcdFx0bGV0IHkgPSByYW5kQihIRUlHSFQpO1xuXHRcdFx0bGV0IHogPSByYW5kKERFUFRIKSAtIEZPUldBUkRfREVQVEg7XG5cdFx0XHRpZiAoeCA+IHogfHwgeCA8IC16IHx8IHkgPiB6IHx8IHkgPCAteilcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRsZXQgc2l6ZSA9IHJhbmQoU0laRSk7XG5cdFx0XHR0aGlzLnN0YXJzLnB1c2gobmV3IFN0YXIoeCwgeSwgeiwgc2l6ZSwgcmFuZCgpIDwgQkxVRV9SQVRFKSk7XG5cdFx0fVxuXHR9XG5cblx0cGFpbnQocGFpbnRlciwgY2FtZXJhKSB7XG5cdFx0Ly8gcGFpbnRlci5hZGQobmV3IFJlY3RDKC41LCAuNSwgMSwgMSwge2ZpbGw6IHRydWV9KSk7XG5cdFx0dGhpcy5zdGFycy5mb3JFYWNoKHN0YXIgPT4gc3Rhci5wYWludChwYWludGVyLCBjYW1lcmEpKTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXJmaWVsZDtcbiIsImNvbnN0IFN0YXJmaWVsZCA9IHJlcXVpcmUoJy4vU3RhcmZpZWxkJyk7XG5jb25zdCB7Tm9pc2VTaW1wbGV4fSA9IHJlcXVpcmUoJy4uL3V0aWwvTm9pc2UnKTtcbmNvbnN0IHtyYW5kfSA9IHJlcXVpcmUoJy4uL3V0aWwvTnVtYmVyJyk7XG5jb25zdCBTdGFyID0gcmVxdWlyZSgnLi9TdGFyJyk7XG5jb25zdCBSZWN0QyA9IHJlcXVpcmUoJy4uL3BhaW50ZXIvUmVjdEMnKTtcblxuLy8gdGhpcyBjbGFzcyBpcyBvbmx5IGZvciB0aGUgU3RhcmZpZWxkRGVtb1xuY2xhc3MgU3RhcmZpZWxkTm9pc2UgZXh0ZW5kcyBTdGFyZmllbGQge1xuXHRjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBleHRyYSA9IDApIHtcblx0XHRzdXBlcigwLCAwLCAwKTtcblxuXHRcdGNvbnN0IERFUFRIID0gMjAgKyBleHRyYSAqIDIwLCBGT1JXQVJEX0RFUFRIID0gLjgsXG5cdFx0XHRXSURUSCA9IHdpZHRoICogREVQVEgsIEhFSUdIVCA9IGhlaWdodCAqIERFUFRILFxuXHRcdFx0Q09VTlQgPSAxMCAqIFdJRFRIICogSEVJR0hULFxuXHRcdFx0U0laRSA9IC4wMyArIGV4dHJhICogLjAzLCBCTFVFX1JBVEUgPSAuMDU7XG5cblx0XHRsZXQgbm9pc2UgPSBuZXcgTm9pc2VTaW1wbGV4KDgpO1xuXG5cdFx0dGhpcy5zdGFycyA9IG5vaXNlLnBvc2l0aW9ucyhDT1VOVCwgV0lEVEgsIEhFSUdIVCkubWFwKChbeCwgeV0pID0+IHtcblx0XHRcdHggLT0gV0lEVEggLyAyO1xuXHRcdFx0eSAtPSBIRUlHSFQgLyAyO1xuXHRcdFx0bGV0IHogPSByYW5kKERFUFRIKTtcblx0XHRcdGlmICh4ID4geiB8fCB4IDwgLXogfHwgeSA+IHogfHwgeSA8IC16KVxuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdGxldCBzaXplID0gcmFuZChTSVpFKTtcblx0XHRcdHJldHVybiBuZXcgU3Rhcih4LCB5LCB6LCBzaXplLCByYW5kKCkgPCBCTFVFX1JBVEUpO1xuXHRcdH0pLmZpbHRlcihzdGFyID0+IHN0YXIpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU3RhcmZpZWxkTm9pc2U7XG4iLCJjb25zdCB7Y2xhbXB9ID0gcmVxdWlyZSgnLi9OdW1iZXInKTtcblxuY29uc3QgU0hBREVfQUREID0gLjI7XG5cbmNsYXNzIENvbG9yIHtcblx0Y29uc3RydWN0b3IociwgZywgYiwgYSA9IDEpIHtcblx0XHR0aGlzLnIgPSBjbGFtcChyLCAwLCAyNTUpO1xuXHRcdHRoaXMuZyA9IGNsYW1wKGcsIDAsIDI1NSk7XG5cdFx0dGhpcy5iID0gY2xhbXAoYiwgMCwgMjU1KTtcblx0XHR0aGlzLmEgPSBjbGFtcChhLCAwLCAxKTtcblx0XHR0aGlzLnN0cmluZyA9IGByZ2JhKCR7dGhpcy5yfSwgJHt0aGlzLmd9LCAke3RoaXMuYn0sICR7dGhpcy5hfSlgO1xuXHR9XG5cblx0c3RhdGljIGZyb20yNTUociwgZywgYiwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IociwgZywgYiwgYSk7XG5cdH1cblxuXHRzdGF0aWMgZnJvbTEocjEsIGcxLCBiMSwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IoLi4uW3IxLCBnMSwgYjFdLm1hcChDb2xvci5vbmVUbzI1NSksIGEpO1xuXHR9XG5cblx0c3RhdGljIGZyb21IZXgocmgsIGdoLCBiaCwgYSkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IoLi4uW3JoLCBnaCwgYmhdLm1hcChDb2xvci5oZXhUbzI1NSksIGEpXG5cdH1cblxuXHRzdGF0aWMgZnJvbUhleFN0cmluZyhoZXgpIHtcblx0XHRpZiAoaGV4WzBdID09PSAnIycpXG5cdFx0XHRoZXggPSBoZXguc3Vic3RyKDEpO1xuXG5cdFx0aWYgKGhleC5sZW5ndGggPT09IDMpXG5cdFx0XHRyZXR1cm4gQ29sb3IuZnJvbTI1NShcblx0XHRcdFx0Q29sb3IuaGV4VG8yNTUocGFyc2VJbnQoaGV4WzBdLCAxNikpLFxuXHRcdFx0XHRDb2xvci5oZXhUbzI1NShwYXJzZUludChoZXhbMV0sIDE2KSksXG5cdFx0XHRcdENvbG9yLmhleFRvMjU1KHBhcnNlSW50KGhleFsyXSwgMTYpKSk7XG5cblx0XHRyZXR1cm4gQ29sb3IuZnJvbTI1NShcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoMCwgMiksIDE2KSxcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoMiwgMiksIDE2KSxcblx0XHRcdHBhcnNlSW50KGhleC5zdWJzdHIoNCwgMiksIDE2KSk7XG5cdH1cblxuXHRtdWx0aXBseShtdWx0KSB7XG5cdFx0cmV0dXJuIG5ldyBDb2xvcih0aGlzLnIgKiBtdWx0LCB0aGlzLmcgKiBtdWx0LCB0aGlzLmIgKiBtdWx0LCB0aGlzLmEpO1xuXHR9XG5cblx0bXVsdGlwbHlGcm9tV2hpdGUobXVsdCkge1xuXHRcdHJldHVybiBuZXcgQ29sb3IoXG5cdFx0XHQyNTUgLSAoMjU1IC0gdGhpcy5yKSAqIG11bHQsXG5cdFx0XHQyNTUgLSAoMjU1IC0gdGhpcy5nKSAqIG11bHQsXG5cdFx0XHQyNTUgLSAoMjU1IC0gdGhpcy5iKSAqIG11bHQsXG5cdFx0XHR0aGlzLmEpO1xuXHR9XG5cblx0YWxwaGFNdWx0aXBseShtdWx0KSB7XG5cdFx0cmV0dXJuIG5ldyBDb2xvcih0aGlzLnIsIHRoaXMuZywgdGhpcy5iLCB0aGlzLmEgKiBtdWx0KTtcblx0fVxuXG5cdGF2Z1doaXRlKHdlaWdodCA9IC41KSB7XG5cdFx0bGV0IGl3ZWlnaHQgPSAxIC0gd2VpZ2h0O1xuXHRcdHJldHVybiBuZXcgQ29sb3IoXG5cdFx0XHR0aGlzLnIgKiBpd2VpZ2h0ICsgd2VpZ2h0ICogMjU1LFxuXHRcdFx0dGhpcy5nICogaXdlaWdodCArIHdlaWdodCAqIDI1NSxcblx0XHRcdHRoaXMuYiAqIGl3ZWlnaHQgKyB3ZWlnaHQgKiAyNTUsXG5cdFx0XHR0aGlzLmEpO1xuXHR9XG5cblx0Z2V0KCkge1xuXHRcdHJldHVybiB0aGlzLnN0cmluZztcblx0fVxuXG5cdC8vIHNoYWRlIHNob3VsZCBiZSAwIChubyBzaGFkaW5nKSB0byAxIChtYXhpbXVtIHNoYWRpbmcpXG5cdGdldFNoYWRlKHNoYWRlID0gMSkge1xuXHRcdGlmIChzaGFkZSA9PT0gMSlcblx0XHRcdHJldHVybiB0aGlzLnNoYWRlU3RyaW5nIHx8ICh0aGlzLnNoYWRlU3RyaW5nID0gdGhpcy5tdWx0aXBseSgxICsgU0hBREVfQUREKS5nZXQoKSk7XG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHkoMSArIFNIQURFX0FERCAqIHNoYWRlKS5nZXQoKTtcblx0fVxuXG5cdGdldEFscGhhKGFscGhhTXVsdCA9IDEpIHtcblx0XHRjb25zdCBOT19DT0xPUiA9IENvbG9yLmZyb20xKDAsIDAsIDAsIDApO1xuXHRcdGlmIChhbHBoYU11bHQgPT09IDEpXG5cdFx0XHRyZXR1cm4gdGhpcy5zdHJpbmc7XG5cdFx0aWYgKGFscGhhTXVsdCA9PT0gMClcblx0XHRcdHJldHVybiBOT19DT0xPUi5nZXQoKTtcblx0XHRyZXR1cm4gdGhpcy5hbHBoYU11bHRpcGx5KGFscGhhTXVsdCkuZ2V0KCk7XG5cdH1cblxuXHRzdGF0aWMgaGV4VG8yNTUoaGV4KSB7XG5cdFx0cmV0dXJuIGhleCAqIDE3XG5cdH1cblxuXHRzdGF0aWMgb25lVG8yNTUob25lKSB7XG5cdFx0cmV0dXJuIHBhcnNlSW50KG9uZSAqIDI1NSk7XG5cdH1cbn1cblxuQ29sb3IuV0hJVEUgPSBDb2xvci5mcm9tMSgwLCAwLCAwKTtcbkNvbG9yLkJMQUNLID0gQ29sb3IuZnJvbTEoMCwgMCwgMCk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG4iLCJjb25zdCBDb2xvciA9IHJlcXVpcmUoJy4vQ29sb3InKTtcblxuY29uc3QgQ29sb3JzID0ge1xuXHQvLyB0b2RvIFttZWRpdW1dIHN0cnVjdHVyZSB0aGVzZSBjb25zdGFudHNcblxuXHQvLyBiYXJzXG5cdEJBUl9TSEFESU5HOiAxLFxuXHRMSUZFOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjZmFiOWIxJykuYXZnV2hpdGUoLjI1KSxcblx0U1RBTUlOQTogQ29sb3IuZnJvbUhleFN0cmluZygnIzk4ZDQ5NCcpLmF2Z1doaXRlKC40KSxcblx0RU5SQUdFOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjNjE2NjAwJyksXG5cblx0VEFSR0VUX0xPQ0s6IENvbG9yLmZyb20xKC41LCAuNSwgLjUpLFxuXHREQU1BR0U6IENvbG9yLmZyb20yNTUoMjU1LCAwLCAwLCAuNCksXG5cblx0Ly8gYWJpbGl0aWVzXG5cdFBMQVlFUl9BQklMSVRJRVM6IFtcblx0XHRDb2xvci5mcm9tSGV4U3RyaW5nKCcjYTg3Njc2JykuYXZnV2hpdGUoLjQpLFxuXHRcdENvbG9yLmZyb21IZXhTdHJpbmcoJyM3NmE4NzYnKS5hdmdXaGl0ZSguNCksXG5cdFx0Q29sb3IuZnJvbUhleFN0cmluZygnIzc2NzZhOCcpLmF2Z1doaXRlKC40KSxcblx0XHRDb2xvci5mcm9tSGV4U3RyaW5nKCcjNzZhNmE2JykuYXZnV2hpdGUoLjQpLFxuXHRcdENvbG9yLmZyb21IZXhTdHJpbmcoJyNhNjc2YTYnKS5hdmdXaGl0ZSguNCksXG5cdFx0Q29sb3IuZnJvbUhleFN0cmluZygnI2E2YTY3NicpLmF2Z1doaXRlKC40KSxcblx0XSxcblx0UExBWUVSX0FCSUxJVFlfTk9UX1JFQURZOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjNDQ0JyksXG5cblx0Ly8gYnVmZnNcblx0UExBWUVSX0JVRkZTOiB7XG5cdFx0REVBRDogQ29sb3IuZnJvbTEoLjUsIC41LCAuNSksXG5cdH0sXG5cblx0SW50ZXJmYWNlOiB7XG5cdFx0SU5BQ1RJVkU6IENvbG9yLmZyb20xKDEsIDEsIDEpLFxuXHRcdEhPVkVSOiBDb2xvci5mcm9tMSguOTUsIC45NSwgLjk1KSxcblx0XHRBQ1RJVkU6IENvbG9yLmZyb20xKDEsIDEsIDEpLFxuXHR9LFxuXG5cdEVudGl0eToge1xuXHRcdE1BUF9CT1VOREFSWTogQ29sb3IuZnJvbUhleFN0cmluZygnI2NjYycpLFxuXHRcdFJPQ0s6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM4ODgnKSxcblx0XHRST0NLX01JTkVSQUw6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM4YjgnKSxcblx0XHRFR0c6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM2OGInKSxcblx0XHRQTEFZRVI6IENvbG9yLmZyb21IZXhTdHJpbmcoJyM4ODgnKSxcblx0XHRQTEFZRVJfR1JFRU46IENvbG9yLmZyb21IZXhTdHJpbmcoJyM2MzhkNTknKSxcblx0XHRGUklFTkRMWTogQ29sb3IuZnJvbUhleFN0cmluZygnIzYzYmQ1OScpLFxuXHRcdE1PTlNURVI6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNiZDYzNTknKSxcblx0XHRGUklFTkRMWV9QUk9KRUNUSUxFOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjNmM2JyksXG5cdFx0SE9TVElMRV9QUk9KRUNUSUxFOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjYzY2JyksXG5cdFx0Qm9tYjoge1xuXHRcdFx0V0FSTklOR19CT1JERVI6IENvbG9yLmZyb21IZXhTdHJpbmcoJyNjYzhmNTInKSxcblx0XHRcdEVOVElUWTogQ29sb3IuZnJvbUhleFN0cmluZygnIzAwYycpXG5cdFx0fSxcblx0XHRBUkVBX0RFR0VOOiB7XG5cdFx0XHRXQVJOSU5HX0JPUkRFUjogQ29sb3IuZnJvbTEoMSwgMCwgMCksXG5cdFx0XHRBQ1RJVkVfRklMTDogQ29sb3IuZnJvbTEoLjgsIDAsIDAsIC4xKVxuXHRcdH0sXG5cdFx0RFVTVDogQ29sb3IuZnJvbUhleFN0cmluZygnI2NjYycpLFxuXHRcdERBTUFHRV9EVVNUOiBDb2xvci5mcm9tSGV4U3RyaW5nKCcjZjg4JyksXG5cdH0sXG5cblx0TW9uc3RlcnM6IHtcblx0XHRPdXRwb3N0UG9ydGFsOiB7XG5cdFx0XHRGSUxMOiBDb2xvci5mcm9tMSgxLCAuOSwgLjkpLFxuXHRcdFx0Qk9SREVSOiBDb2xvci5mcm9tMSgxLCAuNSwgLjUpLFxuXHRcdFx0TElORVM6IENvbG9yLmZyb20xKDEsIC45NSwgLjk1KSxcblx0XHR9XG5cdH0sXG5cblx0U3Rhcjoge1xuXHRcdFdISVRFOiBDb2xvci5mcm9tMSguNywgLjcsIC43KSxcblx0XHRCTFVFOiBDb2xvci5mcm9tMSguNSwgLjUsIC43NSksXG5cdH0sXG5cblx0TWluaW1hcDoge1xuXHRcdEJBQ0tHUk9VTkQ6IENvbG9yLmZyb20xKDEsIDEsIDEsIC41KSxcblx0XHRCT1JERVI6IENvbG9yLmZyb20xKDAsIDAsIDAsIC41KSxcblx0XHRST0NLOiBDb2xvci5mcm9tMSgwLCAwLCAwKSxcblx0XHRNT05TVEVSOiBDb2xvci5mcm9tMSgxLCAwLCAwKSxcblx0XHRCT1NTOiBDb2xvci5mcm9tMSgxLCAwLCAuNiksXG5cdFx0UExBWUVSOiBDb2xvci5mcm9tMSgwLCAwLCAxKSxcblx0fVxufTtcblxuY29uc3QgUG9zaXRpb25zID0ge1xuXHRNQVJHSU46IC4wMixcblx0QkFSX0hFSUdIVDogLjAyLFxuXHRQTEFZRVJfQkFSX1g6IC41LFxuXHRBQklMSVRZX1NJWkU6IC4wNixcblx0QUJJTElUWV9DSEFOTkVMX0JBUl9TSVpFOiAuMDEsXG5cdEJVRkZfU0laRTogLjA1LFxuXHRTVEFHRV9URVhUX0hFSUdIVDogLjAzLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7Q29sb3JzLCBQb3NpdGlvbnN9O1xuXG4vLyBOb3Rlc1xuXG4vLyBTSElFTERfQ09MT1I6IENvbG9yLmZyb20xKC40LCAuNSwgLjcpLFxuLy8gUkVTRVJWRV9DT0xPUjogQ29sb3IuZnJvbTEoLjIsIC42LCAuNiksXG4vLyBFWFBFUklFTkNFX0NPTE9SOiBDb2xvci5mcm9tMSguOSwgLjYsIC4xKSxcblxuLy8gTElGRV9FTVBUWV9DT0xPUjogQ29sb3IuZnJvbUhleCgweDQsIDB4YiwgMHhjKSxcbi8vIExJRkVfRklMTF9DT0xPUjogQ29sb3IuZnJvbUhleCgweDUsIDB4ZCwgMHhmKSxcbi8vIFNUQU1JTkFfRU1QVFlfQ09MT1I6IENvbG9yLmZyb21IZXgoMHhjLCAweGMsIDB4NCksXG4vLyBTVEFNSU5BX0ZJTExfQ09MT1I6IENvbG9yLmZyb21IZXgoMHhmLCAweGYsIDB4NSksXG5cbi8vIGNvbnN0IGxvY2FsTGlmZSA9IFwiI2NjNGU0ZVwiO1xuLy8gY29uc3QgbG9jYWxTdGFtaW5hID0gXCIjZmZjYzk5XCI7XG4vLyBjb25zdCBsb2NhbFNoaWVsZCA9IFwiIzY2ODBiM1wiO1xuLy8gY29uc3QgbG9jYWxSZXNlcnZlID0gXCIjMzM5OTk5XCI7XG4vLyBjb25zdCBsb2NhbEV4cGVyaWVuY2UgPSBcIiNlNjk5MWFcIjtcblxuLy8gaHR0cDovL3BhbGV0dG9uLmNvbS8jdWlkPTc1QzBGMGtqK3paOVhSdGZ1SXZvMHVsc0pxZlxuXG4vLyB0b2RvIFtsb3ddIGZpbmQgcHJldHRpZXIgY29sb3JzXG4iLCJjbGFzcyBEZWNheSB7XG5cdGNvbnN0cnVjdG9yKG1heCwgZGVjYXlSYXRlKSB7XG5cdFx0dGhpcy5tYXggPSBtYXg7XG5cdFx0dGhpcy5kZWNheVJhdGUgPSBkZWNheVJhdGU7XG5cdFx0dGhpcy52YWx1ZSA9IDA7XG5cdH1cblxuXHRhZGQoYW1vdW50KSB7XG5cdFx0aWYgKGFtb3VudCA+IDApXG5cdFx0XHR0aGlzLnZhbHVlID0gTWF0aC5taW4odGhpcy52YWx1ZSArIGFtb3VudCwgdGhpcy5tYXggKyB0aGlzLmRlY2F5UmF0ZSk7XG5cdH1cblxuXHRkZWNheSgpIHtcblx0XHRpZiAodGhpcy52YWx1ZSA+IDApXG5cdFx0XHR0aGlzLnZhbHVlID0gTWF0aC5tYXgodGhpcy52YWx1ZSAtIHRoaXMuZGVjYXlSYXRlLCAwKTtcblx0fVxuXG5cdGdldCgpIHtcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSAvIHRoaXMubWF4O1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGVjYXk7XG4iLCJjb25zdCBtYWtlRW51bSA9ICguLi52YWx1ZXMpID0+IHtcblx0bGV0IGVudW1iID0ge307XG5cdHZhbHVlcy5mb3JFYWNoKCh2YWx1ZSwgaW5kZXgpID0+IGVudW1iW3ZhbHVlXSA9IGluZGV4KTtcblx0cmV0dXJuIGVudW1iO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBtYWtlRW51bTtcbiIsImNvbnN0IHtyb3VuZH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xuXG5jbGFzcyBGcHNUcmFja2VyIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5mcHMgPSAwO1xuXHR9XG5cblx0dGljaygpIHtcblx0XHRsZXQgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0bGV0IHBhc3NlZCA9IG5vdyAtIHRoaXMuc3RhcnQ7XG5cdFx0aWYgKCEocGFzc2VkIDwgMTAwMCkpIHtcblx0XHRcdHRoaXMuc3RhcnQgPSBub3c7XG5cdFx0XHR0aGlzLmZwcyA9IHRoaXMudGlja3MgKiAxMDAwIC8gcGFzc2VkO1xuXHRcdFx0dGhpcy50aWNrcyA9IDA7XG5cdFx0fVxuXHRcdHRoaXMudGlja3MrKztcblx0fVxuXG5cdGdldEZwcygpIHtcblx0XHR0aGlzLnRpY2soKTtcblx0XHRyZXR1cm4gcm91bmQodGhpcy5mcHMpO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRnBzVHJhY2tlcjtcbiIsImNsYXNzIEl0ZW0ge1xuICAgIGNvbnN0cnVjdG9yKHZhbHVlLCBwcmV2KSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5wcmV2ID0gcHJldjtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlbTtcbiIsImNvbnN0IEl0ZW0gPSByZXF1aXJlKCcuL0l0ZW0nKTtcblxuY2xhc3MgTGlua2VkTGlzdCB7XG5cdGNvbnN0cnVjdG9yKCkge1xuXHRcdHRoaXMubGVuZ3RoID0gMDtcblx0fVxuXG5cdGFkZCh2YWx1ZSkge1xuXHRcdHRoaXMubGVuZ3RoKys7XG5cdFx0cmV0dXJuICF0aGlzLmhlYWRcblx0XHRcdD8gdGhpcy50YWlsID0gdGhpcy5oZWFkID0gbmV3IEl0ZW0odmFsdWUpXG5cdFx0XHQ6IHRoaXMudGFpbCA9IHRoaXMudGFpbC5uZXh0ID0gbmV3IEl0ZW0odmFsdWUsIHRoaXMudGFpbCk7XG5cdH1cblxuXHRyZW1vdmUoaXRlbSkge1xuXHRcdHRoaXMubGVuZ3RoLS07XG5cdFx0aWYgKGl0ZW0ucHJldilcblx0XHRcdGl0ZW0ucHJldi5uZXh0ID0gaXRlbS5uZXh0O1xuXHRcdGlmIChpdGVtLm5leHQpXG5cdFx0XHRpdGVtLm5leHQucHJldiA9IGl0ZW0ucHJldjtcblx0XHRpZiAodGhpcy5oZWFkID09PSBpdGVtKVxuXHRcdFx0dGhpcy5oZWFkID0gaXRlbS5uZXh0O1xuXHRcdGlmICh0aGlzLnRhaWwgPT09IGl0ZW0pXG5cdFx0XHR0aGlzLnRhaWwgPSBpdGVtLnByZXY7XG5cdH1cblxuXHRmb3JFYWNoKGhhbmRsZXIpIHtcblx0XHRsZXQgaXRlciA9IHRoaXMuaGVhZDtcblx0XHR3aGlsZSAoaXRlcikge1xuXHRcdFx0aGFuZGxlcihpdGVyLnZhbHVlLCBpdGVyKTtcblx0XHRcdGl0ZXIgPSBpdGVyLm5leHQ7XG5cdFx0fVxuXHR9XG5cblx0ZmlsdGVyKGhhbmRsZXIpIHtcblx0XHRsZXQgb3V0cHV0ID0gW107XG5cdFx0bGV0IGl0ZXIgPSB0aGlzLmhlYWQ7XG5cdFx0d2hpbGUgKGl0ZXIpIHtcblx0XHRcdGlmIChoYW5kbGVyKGl0ZXIudmFsdWUsIGl0ZXIpKVxuXHRcdFx0XHRvdXRwdXQucHVzaChpdGVyKTtcblx0XHRcdGl0ZXIgPSBpdGVyLm5leHQ7XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHRmaW5kKGhhbmRsZXIpIHtcblx0XHRsZXQgaXRlciA9IHRoaXMuaGVhZDtcblx0XHR3aGlsZSAoaXRlcikge1xuXHRcdFx0aWYgKGhhbmRsZXIoaXRlci52YWx1ZSwgaXRlcikpXG5cdFx0XHRcdHJldHVybiBpdGVyO1xuXHRcdFx0aXRlciA9IGl0ZXIubmV4dDtcblx0XHR9XG5cdH1cblxuXHRbU3ltYm9sLml0ZXJhdG9yXSgpIHtcblx0XHRsZXQgaXRlciA9IHRoaXMuaGVhZDtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bmV4dDogKCkgPT4ge1xuXHRcdFx0XHRpZiAoIWl0ZXIpXG5cdFx0XHRcdFx0cmV0dXJuIHtkb25lOiB0cnVlfTtcblx0XHRcdFx0bGV0IHZhbHVlID0gaXRlci52YWx1ZTtcblx0XHRcdFx0aXRlciA9IGl0ZXIubmV4dDtcblx0XHRcdFx0cmV0dXJuIHt2YWx1ZSwgZG9uZTogZmFsc2V9O1xuXHRcdFx0fVxuXHRcdH07XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaW5rZWRMaXN0O1xuIiwiY29uc3QgU2ltcGxleE5vaXNlID0gcmVxdWlyZSgnc2ltcGxleC1ub2lzZScpO1xuXG5jb25zdCB7RVBTSUxPTiwgZ2V0TWFnbml0dWRlLCByYW5kfSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNsYXNzIE5vaXNlU2ltcGxleCB7XG5cdGNvbnN0cnVjdG9yKHNjYWxlID0gMTAsIHRocmVzaG9sZCA9IC41LCB0aHJlc2hvbGRSYW5kV2VpZ2h0ID0gMSkge1xuXHRcdHRoaXMuc2NhbGUgPSBzY2FsZTtcblx0XHR0aGlzLnRocmVzaG9sZCA9IHRocmVzaG9sZDtcblx0XHR0aGlzLnRocmVzaG9sZFJhbmRXZWlnaHQgPSB0aHJlc2hvbGRSYW5kV2VpZ2h0O1xuXHRcdHRoaXMuc2ltcGxleE5vaXNlID0gbmV3IFNpbXBsZXhOb2lzZShyYW5kKTtcblx0fVxuXG5cdGdldCh4LCB5KSB7XG5cdFx0cmV0dXJuIHRoaXMuc2ltcGxleE5vaXNlLm5vaXNlMkQoeCAqIHRoaXMuc2NhbGUgKyAxLCB5ICogdGhpcy5zY2FsZSkgKiAuNSArIC41OyAvLyBzZWVtcyBsaWtlIHNpbXBsZXhOb2lzZSBpbXBsZW1lbnRhdGlvbiBpcyBidWdnZWQgdG8gYWx3YXlzIHJldHVybiAwIGF0ICgwLCAwKVxuXHR9XG5cblx0Ly8gbm90IGNvbnNpc3RlbnQsIGNhbGxpbmcgaXQgbXVsdGlwbGUgdGltZXMgd2l0aCBzYW1lIHBhcmFtZXRlcnMgY2FuIHlpZWxkIGRpZmZlcmVudCByZXN1bHRzXG5cdGdldEIoeCwgeSkge1xuXHRcdHJldHVybiB0aGlzLmdldCh4LCB5KSA+IHRoaXMudGhyZXNob2xkICsgcmFuZCh0aGlzLnRocmVzaG9sZFJhbmRXZWlnaHQpO1xuXHR9XG5cblx0Ly8gcmV0dXJuIGNvdW50IG51bWJlciBvZiBwb3NpdGlvbnMgd2l0aGluIHJhbmdlIFtbMCAtIHdpZHRoXSwgWzAgLSBoZWlnaHRdXSwgc3RydWN0dXJlZCBhcyAyZCBhcnJheVxuXHQvLyBub3QgY29uc2lzdGVudCwgY2FsbGluZyBpdCBtdWx0aXBsZSB0aW1lcyB3aXRoIHNhbWUgcGFyYW1ldGVycyBjYW4geWllbGQgZGlmZmVyZW50IHJlc3VsdHNcblx0cG9zaXRpb25zKGNvdW50LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0bGV0IHBvc2l0aW9ucyA9IFtdO1xuXHRcdHdoaWxlIChwb3NpdGlvbnMubGVuZ3RoIDwgY291bnQpIHtcblx0XHRcdGxldCB4ID0gcmFuZCgpO1xuXHRcdFx0bGV0IHkgPSByYW5kKCk7XG5cdFx0XHRpZiAodGhpcy5nZXRCKHgsIHkpKVxuXHRcdFx0XHRwb3NpdGlvbnMucHVzaChbeCAqIHdpZHRoLCB5ICogaGVpZ2h0XSk7XG5cdFx0fVxuXHRcdHJldHVybiBwb3NpdGlvbnM7XG5cdH1cblxuXHQvLyByZXR1cm4gcG9zaXRpb24gd2l0aCBsb3dlc3Qgbm9pc2UgdmFsdWUgb2YgY291bnQgcmFuZG9tIHBvc2l0aW9ucywgd2l0aGluIHJhbmdlIFtbMCAtIHdpZHRoXSwgWzAgLSBoZWlnaHRdXVxuXHQvLyBub3QgY29uc2lzdGVudCwgY2FsbGluZyBpdCBtdWx0aXBsZSB0aW1lcyB3aXRoIHNhbWUgcGFyYW1ldGVycyBjYW4geWllbGQgZGlmZmVyZW50IHJlc3VsdHNcblx0cG9zaXRpb25zTG93ZXN0KGNvdW50LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0bGV0IHBvc2l0aW9uID0gW107XG5cdFx0bGV0IG1pbk5vaXNlID0gMTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcblx0XHRcdGxldCB4ID0gcmFuZCgpO1xuXHRcdFx0bGV0IHkgPSByYW5kKCk7XG5cdFx0XHRsZXQgbm9pc2UgPSB0aGlzLmdldCh4LCB5KTtcblx0XHRcdGlmIChub2lzZSA8IG1pbk5vaXNlKSB7XG5cdFx0XHRcdG1pbk5vaXNlID0gbm9pc2U7XG5cdFx0XHRcdHBvc2l0aW9uID0gW3ggKiB3aWR0aCwgeSAqIGhlaWdodF07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBwb3NpdGlvbjtcblx0fVxufVxuXG5jbGFzcyBOb2lzZUdyYWRpZW50IHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5wb2ludHMgPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IDEwMDA7IGkrKylcblx0XHRcdHRoaXMucG9pbnRzLnB1c2goW3JhbmQoKSwgcmFuZCgpLCByYW5kKCldKTtcblx0fVxuXG5cdGdldCh4LCB5KSB7XG5cdFx0bGV0IHdlaWdodCA9IDA7XG5cdFx0bGV0IHogPSAwO1xuXHRcdHRoaXMucG9pbnRzLmZvckVhY2goKFtweCwgcHksIHB6XSkgPT4ge1xuXHRcdFx0bGV0IGQgPSBnZXRNYWduaXR1ZGUocHggLSB4LCBweSAtIHkpO1xuXHRcdFx0ZCA9IDEgLyAoZCArIEVQU0lMT04pO1xuXHRcdFx0d2VpZ2h0ICs9IGQ7XG5cdFx0XHR6ICs9IHB6ICogZDtcblx0XHR9KTtcblx0XHRyZXR1cm4geiAvIHdlaWdodDtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtOb2lzZVNpbXBsZXgsIE5vaXNlR3JhZGllbnR9O1xuIiwiY29uc3QgRVBTSUxPTiA9IDFlLTEwLCBQSSA9IE1hdGguUEksIFBJMiA9IFBJICogMjtcblxuY29uc3QgbWluV2hpY2ggPSAoaSwgaikgPT4gaSA8IGogPyBbaSwgMF0gOiBbaiwgMV07XG5cbmNvbnN0IG1heFdoaWNoID0gKGksIGopID0+IGkgPiBqID8gW2ksIDBdIDogW2osIDFdO1xuXG5jb25zdCBtaW5XaGljaEEgPSBhcnIgPT4gYXJyLnJlZHVjZSgobWluSSwgdiwgaSwgYSkgPT4gdiA8IGFbbWluSV0gPyBpIDogbWluSSwgMCk7XG5cbmNvbnN0IG1heFdoaWNoQSA9IGFyciA9PiBhcnIucmVkdWNlKChtYXhJLCB2LCBpLCBhKSA9PiB2ID4gYVttYXhJXSA/IGkgOiBtYXhJLCAwKTtcblxuY29uc3QgZ2V0RGlhbW9uZERpc3RhbmNlID0gKHgsIHkpID0+IE1hdGguYWJzKHgpICsgTWF0aC5hYnMoeSk7XG5cbmNvbnN0IGdldFJlY3REaXN0YW5jZSA9ICh4LCB5KSA9PiBNYXRoLm1heChNYXRoLmFicyh4KSwgTWF0aC5hYnMoeSkpO1xuXG4vLyB0b2RvIFttZWRpdW1dIGRlcHJlY2F0ZWRcbi8vIHRvZG8gW21lZGl1bV0gcmVwbGFjZSBnZXRNYWduaXR1ZGUgdXNlcyB3aXRoIGdldE1hZ25pdHVkZVNxciB3aGVyZSBwb3NzaWJsZVxuY29uc3QgZ2V0TWFnbml0dWRlU3FyID0gKHt4LCB5fSkgPT4geCAqIHggKyB5ICogeTtcblxuLy8gdG9kbyBbbWVkaXVtXSBkZXByZWNhdGVkXG5jb25zdCBnZXRNYWduaXR1ZGUgPSAoeCwgeSkgPT4gTWF0aC5zcXJ0KGdldE1hZ25pdHVkZVNxcih7eCwgeX0pKTtcblxuLy8gdG9kbyBbbWVkaXVtXSBkZXByZWNhdGVkXG5jb25zdCBzZXRNYWduaXR1ZGUgPSAoeCwgeSwgbWFnbml0dWRlID0gMSkgPT4ge1xuXHRsZXQgcHJldk1hZ25pdHVkZSA9IGdldE1hZ25pdHVkZSh4LCB5KTtcblx0aWYgKCFwcmV2TWFnbml0dWRlKVxuXHRcdHJldHVybiB7eDogbWFnbml0dWRlLCB5OiAwLCBwcmV2TWFnbml0dWRlfTtcblx0bGV0IG11bHQgPSBtYWduaXR1ZGUgLyBwcmV2TWFnbml0dWRlO1xuXHRyZXR1cm4ge3g6IHggKiBtdWx0LCB5OiB5ICogbXVsdCwgcHJldk1hZ25pdHVkZX07XG59O1xuXG5jb25zdCBjbGFtcCA9ICh4LCBtaW4sIG1heCkgPT4ge1xuXHRpZiAoeCA8IG1pbilcblx0XHRyZXR1cm4gbWluO1xuXHRyZXR1cm4geCA+IG1heCA/IG1heCA6IHg7XG59O1xuXG4vLyB0b2RvIFttZWRpdW1dIGRlcHJlY2F0ZWRcbmNvbnN0IHRoZXRhVG9WZWN0b3IgPSAodGhldGEsIG1hZ25pdHVkZSA9IDEpID0+IFtjb3ModGhldGEpICogbWFnbml0dWRlLCBzaW4odGhldGEpICogbWFnbml0dWRlXTtcblxuY29uc3QgY29zID0gdGhldGEgPT4gTWF0aC5jb3ModGhldGEpO1xuXG5jb25zdCBzaW4gPSB0aGV0YSA9PiBNYXRoLnNpbih0aGV0YSk7XG5cbmNvbnN0IGJvb2xlYW5BcnJheSA9IGFycmF5ID0+IGFycmF5LnNvbWUoYSA9PiBhKTtcblxuY29uc3QgYXZnID0gKGEsIGIsIHdlaWdodCA9IC41KSA9PiBhICogd2VpZ2h0ICsgYiAqICgxIC0gd2VpZ2h0KTtcblxuLy8gWzAsIG1heClcbmNvbnN0IHJhbmQgPSAobWF4ID0gMSkgPT4gTWF0aC5yYW5kb20oKSAqIG1heDtcblxuLy8gWy1tYXgvMiwgbWF4LzIpXG5jb25zdCByYW5kQiA9IChtYXggPSAxKSA9PiByYW5kKG1heCkgLSBtYXggLyAyO1xuXG4vLyBbMCwgbWF4KVxuY29uc3QgcmFuZEludCA9IG1heCA9PiBNYXRoLmZsb29yKHJhbmQobWF4KSk7XG5cbi8vIHRvZG8gW21lZGl1bV0gZGVwcmVjYXRlZFxuY29uc3QgcmFuZFZlY3RvciA9IG1hZ25pdHVkZSA9PlxuXHR0aGV0YVRvVmVjdG9yKHJhbmQoUEkyKSwgcmFuZChtYWduaXR1ZGUpKTtcblxuLy8gdG9kbyBbbWVkaXVtXSBkZXByZWNhdGVkXG5jb25zdCB2ZWN0b3JEZWx0YSA9IChhLCBiKSA9PiAoe3g6IGIueCAtIGEueCwgeTogYi55IC0gYS55fSk7XG5cbi8vIHRvZG8gW21lZGl1bV0gZGVwcmVjYXRlZFxuY29uc3QgdmVjdG9yU3VtID0gKC4uLnZzKSA9PlxuXHR2cy5yZWR1Y2UoKHYsIHN1bSkgPT4gKHt4OiBzdW0ueCArIHYueCwgeTogc3VtLnkgKyB2Lnl9KSwge3g6IDAsIHk6IDB9KTtcblxuY29uc3QgZmxvb3IgPSBudW1iZXIgPT4gTWF0aC5mbG9vcihudW1iZXIpO1xuXG5jb25zdCByb3VuZCA9IChudW1iZXIsIHByZWNpc2lvbiA9IDApID0+IHtcblx0bGV0IHRlbiA9IDEwICoqIHByZWNpc2lvbjtcblx0cmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogdGVuKSAvIHRlbjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRFUFNJTE9OLFxuXHRQSSxcblx0UEkyLFxuXHRtaW5XaGljaCxcblx0bWF4V2hpY2gsXG5cdG1pbldoaWNoQSxcblx0bWF4V2hpY2hBLFxuXHRnZXREaWFtb25kRGlzdGFuY2UsXG5cdGdldFJlY3REaXN0YW5jZSxcblx0Z2V0TWFnbml0dWRlU3FyLFxuXHRnZXRNYWduaXR1ZGUsXG5cdHNldE1hZ25pdHVkZSxcblx0Y2xhbXAsXG5cdHRoZXRhVG9WZWN0b3IsXG5cdGNvcyxcblx0c2luLFxuXHRib29sZWFuQXJyYXksXG5cdGF2Zyxcblx0cmFuZCxcblx0cmFuZEIsXG5cdHJhbmRJbnQsXG5cdHJhbmRWZWN0b3IsXG5cdHZlY3RvckRlbHRhLFxuXHR2ZWN0b3JTdW0sXG5cdGZsb29yLFxuXHRyb3VuZCxcbn07XG5cbi8vIHRvZG8gW21lZGl1bV0gY29uc2lzdGVudCByZXR1cm4ge3gsIHl9IGZvciB2ZWN0b3JzIGluc3RlYWQgb2YgW3gsIHldIGZvciBzb21lXG4vLyB0b2RvIFttZWRpdW1dIGNvbnNpc3RlbnQgaW5wdXQgKHt4LCB5fSkgZm9yIHZlY3RvcnMgaW5zdGVhZCBvZiAoeCwgeSlcbiIsImNvbnN0IHtyYW5kSW50fSA9IHJlcXVpcmUoJy4vTnVtYmVyJyk7XG5cbmNsYXNzIFBoYXNlIHtcblx0Ly8gZHVyYXRpb25zIHNob3VsZCBiZSA+PSAwXG5cdGNvbnN0cnVjdG9yKC4uLmR1cmF0aW9ucykge1xuXHRcdHRoaXMuZHVyYXRpb25zID0gZHVyYXRpb25zO1xuXHRcdHRoaXMuc2V0U2VxdWVudGlhbFN0YXJ0UGhhc2UoMCk7XG5cdFx0dGhpcy5zZXRQaGFzZSgwKTtcblx0fVxuXG5cdHNldFNlcXVlbnRpYWxTdGFydFBoYXNlKHBoYXNlKSB7XG5cdFx0dGhpcy5zZXF1ZW50aWFsU3RhcnRQaGFzZSA9IHBoYXNlO1xuXHR9XG5cblx0c2V0UGhhc2UocGhhc2UpIHtcblx0XHR0aGlzLnBoYXNlID0gcGhhc2U7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IHRoaXMuZHVyYXRpb25zW3BoYXNlXTtcblx0fVxuXG5cdHNldFJhbmRvbVRpY2soKSB7XG5cdFx0dGhpcy5kdXJhdGlvbiA9IHJhbmRJbnQodGhpcy5kdXJhdGlvbnNbdGhpcy5waGFzZV0pICsgMTtcblx0fVxuXG5cdG5leHRQaGFzZSgpIHtcblx0XHR0aGlzLnNldFBoYXNlKCsrdGhpcy5waGFzZSA8IHRoaXMuZHVyYXRpb25zLmxlbmd0aCA/IHRoaXMucGhhc2UgOiB0aGlzLnNlcXVlbnRpYWxTdGFydFBoYXNlKTtcblx0fVxuXG5cdC8vIHJldHVybiB0cnVlIGlmIHBoYXNlIGVuZHMgKGUuZy4sIGR1cmF0aW9uIGVxdWFsZWQgMSlcblx0dGljaygpIHtcblx0XHRyZXR1cm4gdGhpcy5kdXJhdGlvbiAmJiAhLS10aGlzLmR1cmF0aW9uO1xuXHR9XG5cblx0Ly8gcmV0dXJuIHRydWUgaWYgcGhhc2UgZW5kcyAoc2VlIHRpY2soKSlcblx0Ly8gaWYgdGljayA9IDAsIHdpbGwgcmVtYWluIDAgYW5kIHBoYXNlIHdpbGwgbm90IGl0ZXJhdGVcblx0c2VxdWVudGlhbFRpY2soKSB7XG5cdFx0aWYgKHRoaXMudGljaygpKSB7XG5cdFx0XHR0aGlzLm5leHRQaGFzZSgpO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9XG5cblx0aXNOZXcoKSB7XG5cdFx0cmV0dXJuIHRoaXMuZHVyYXRpb24gPT09IHRoaXMuZHVyYXRpb25zW3RoaXMucGhhc2VdO1xuXHR9XG5cblx0Z2V0KCkge1xuXHRcdHJldHVybiB0aGlzLnBoYXNlO1xuXHR9XG5cblx0Ly8gc3RhcnRzIGF0IDAsIGluY3JlYXNlcyB0byAxXG5cdGdldFJhdGlvKCkge1xuXHRcdHJldHVybiAxIC0gdGhpcy5kdXJhdGlvbiAvIHRoaXMuZHVyYXRpb25zW3RoaXMucGhhc2VdO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGhhc2U7XG4iLCJjb25zdCB7Y2xhbXB9ID0gcmVxdWlyZSgnLi9OdW1iZXInKTtcclxuXHJcbmNsYXNzIFBvb2wge1xyXG5cdGNvbnN0cnVjdG9yKG1heCwgaW5jcmVtZW50UmF0ZSA9IDApIHtcclxuXHRcdHRoaXMudmFsdWUgPSB0aGlzLm1heCA9IG1heDtcclxuXHRcdHRoaXMuaW5jcmVtZW50UmF0ZSA9IGluY3JlbWVudFJhdGU7XHJcblx0fVxyXG5cclxuXHQvLyByZXR1cm4gdHJ1ZSBpZiByZWFjaGVkIDAgb3IgbWF4XHJcblx0aW5jcmVtZW50KCkge1xyXG5cdFx0cmV0dXJuIHRoaXMuY2hhbmdlKHRoaXMuaW5jcmVtZW50UmF0ZSk7XHJcblx0fVxyXG5cclxuXHRyZXN0b3JlKCkge1xyXG5cdFx0dGhpcy52YWx1ZSA9IHRoaXMubWF4O1xyXG5cdH1cclxuXHJcblx0Ly8gcmV0dXJuIHRydWUgaWYgcmVhY2hlZCAwIG9yIG1heFxyXG5cdGNoYW5nZShhbW91bnQpIHtcclxuXHRcdHRoaXMudmFsdWUgPSBjbGFtcCh0aGlzLnZhbHVlICsgYW1vdW50LCAwLCB0aGlzLm1heCk7XHJcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSA9PT0gMCB8fCB0aGlzLnZhbHVlID09PSB0aGlzLm1heDtcclxuXHR9XHJcblxyXG5cdGdldCgpIHtcclxuXHRcdHJldHVybiB0aGlzLnZhbHVlO1xyXG5cdH1cclxuXHJcblx0Z2V0TWF4KCkge1xyXG5cdFx0cmV0dXJuIHRoaXMubWF4O1xyXG5cdH1cclxuXHJcblx0Z2V0UmF0aW8oKSB7XHJcblx0XHRyZXR1cm4gdGhpcy52YWx1ZSAvIHRoaXMubWF4O1xyXG5cdH1cclxuXHJcblx0aXNGdWxsKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMudmFsdWUgPT09IHRoaXMubWF4O1xyXG5cdH1cclxuXHJcblx0aXNFbXB0eSgpIHtcclxuXHRcdHJldHVybiAhdGhpcy52YWx1ZTtcclxuXHR9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gUG9vbDtcclxuIiwibGV0IHJlY29yZCA9IChtcyA9IDApID0+IHtcclxuXHRsZXQgc3RyZWFtID0gY2FudmFzLmNhcHR1cmVTdHJlYW0oMjApO1xyXG5cdGxldCByZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwge21pbWVUeXBlOiAndmlkZW8vd2VibSd9KTtcclxuXHRsZXQgZGF0YSA9IFtdO1xyXG5cclxuXHRyZWNvcmRlci5hZGRFdmVudExpc3RlbmVyKCdkYXRhYXZhaWxhYmxlJywgZXZlbnQgPT4gZGF0YS5wdXNoKGV2ZW50LmRhdGEpKTtcclxuXHJcblx0cmVjb3JkZXIuYWRkRXZlbnRMaXN0ZW5lcignc3RvcCcsICgpID0+IHtcclxuXHRcdGxldCBibG9iID0gbmV3IEJsb2IoZGF0YSwge3R5cGU6ICd2aWRlby93ZWJtJ30pO1xyXG5cdFx0bGV0IGV4cG9ydFVybCA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcblx0XHR3aW5kb3cub3BlbihleHBvcnRVcmwsICdfYmxhbmsnKTtcclxuXHR9KTtcclxuXHJcblx0bGV0IHN0b3AgPSAoKSA9PiB7XHJcblx0XHRyZWNvcmRlci5zdG9wKCk7XHJcblx0XHRzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB0cmFjay5zdG9wKCkpO1xyXG5cdH07XHJcblxyXG5cdGlmIChtcylcclxuXHRcdHNldFRpbWVvdXQoKCkgPT4gc3RvcCwgbXMpO1xyXG5cdHJlY29yZGVyLnN0YXJ0KCk7XHJcblxyXG5cdHJldHVybiBzdG9wO1xyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZWNvcmQ7XHJcbiIsImNvbnN0IHtQSTIsIGNsYW1wLCBjb3MsIHNpbiwgcmFuZH0gPSByZXF1aXJlKCcuL051bWJlcicpO1xyXG5cclxuY2xhc3MgVmVjdG9yIHtcclxuXHRjb25zdHJ1Y3Rvcih4LCB5KSB7XHJcblx0XHR0aGlzLnggPSB4O1xyXG5cdFx0dGhpcy55ID0geTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBmcm9tT2JqKHt4LCB5fSkge1xyXG5cdFx0cmV0dXJuIG5ldyBWZWN0b3IoeCwgeSk7XHJcblx0fVxyXG5cclxuXHRzdGF0aWMgZnJvbVRoZXRhKHRoZXRhLCBtYWduaXR1ZGUgPSAxKSB7XHJcblx0XHRyZXR1cm4gbmV3IFZlY3Rvcihjb3ModGhldGEpICogbWFnbml0dWRlLCBzaW4odGhldGEpICogbWFnbml0dWRlKTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBmcm9tUmFuZChtYXhNYWduaXR1ZGUgPSAxLCBtaW5NYWduaXR1ZGUgPSAwKSB7XHJcblx0XHRyZXR1cm4gVmVjdG9yLmZyb21UaGV0YShyYW5kKFBJMiksIG1pbk1hZ25pdHVkZSArIHJhbmQobWF4TWFnbml0dWRlIC0gbWluTWFnbml0dWRlKSlcclxuXHR9XHJcblxyXG5cdGdldCBjb3B5KCkge1xyXG5cdFx0cmV0dXJuIFZlY3Rvci5mcm9tT2JqKHRoaXMpO1xyXG5cdH1cclxuXHJcblx0YWRkKHYpIHtcclxuXHRcdHRoaXMueCArPSB2Lng7XHJcblx0XHR0aGlzLnkgKz0gdi55O1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRzdWJ0cmFjdCh2KSB7XHJcblx0XHR0aGlzLnggLT0gdi54O1xyXG5cdFx0dGhpcy55IC09IHYueTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0bmVnYXRlKCkge1xyXG5cdFx0dGhpcy54ID0gLXRoaXMueDtcclxuXHRcdHRoaXMueSA9IC10aGlzLnk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdG11bHRpcGx5KHNjYWxlKSB7XHJcblx0XHR0aGlzLnggKj0gc2NhbGU7XHJcblx0XHR0aGlzLnkgKj0gc2NhbGU7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGRvdCh2KSB7XHJcblx0XHRyZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xyXG5cdH1cclxuXHJcblx0Ly8gcG9zaXRpdmUgaWYgdiBpcyBjbG9ja3dpc2Ugb2YgdGhpc1xyXG5cdGNyb3NzKHYpIHtcclxuXHRcdHJldHVybiB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2Lng7XHJcblx0fVxyXG5cclxuXHRnZXQgbWFnbml0dWRlU3FyKCkge1xyXG5cdFx0cmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcclxuXHR9XHJcblxyXG5cdC8vIHRvZG8gW21lZGl1bV0gY2hlY2sgaWYgYW55IHVzZXMgb2YgbWFnbml0dWRlIGNhbiBiZSByZXBsYWNlZCB3aXRoIG1hZ25pdHVkZVNxclxyXG5cdGdldCBtYWduaXR1ZGUoKSB7XHJcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KHRoaXMubWFnbml0dWRlU3FyKTtcclxuXHR9XHJcblxyXG5cdHNldCBtYWduaXR1ZGUobWFnbml0dWRlKSB7XHJcblx0XHRsZXQgcHJldk1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlO1xyXG5cdFx0aWYgKCFwcmV2TWFnbml0dWRlKSB7XHJcblx0XHRcdHRoaXMueCA9IG1hZ25pdHVkZTtcclxuXHRcdFx0dGhpcy55ID0gMDtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGxldCBtdWx0ID0gbWFnbml0dWRlIC8gcHJldk1hZ25pdHVkZTtcclxuXHRcdFx0dGhpcy5tdWx0aXBseShtdWx0KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBwcmV2TWFnbml0dWRlO1xyXG5cdH1cclxuXHJcblx0Ly8gcm90YXRlcyBjbG9ja3dpc2VcclxuXHRyb3RhdGVCeUNvc1Npbihjb3MsIHNpbikge1xyXG5cdFx0bGV0IHRlbXBYID0gdGhpcy54O1xyXG5cdFx0dGhpcy54ID0gdGhpcy54ICogY29zIC0gdGhpcy55ICogc2luO1xyXG5cdFx0dGhpcy55ID0gdGVtcFggKiBzaW4gKyB0aGlzLnkgKiBjb3M7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdC8vIGFzc3VtZXMgKGNvcywgc2luKSByZXByZXNlbnRzIGEgcm90YXRpb24gKDAsIFBJKS5cclxuXHRyb3RhdGVCeUNvc1NpblRvd2FyZHMoY29zLCBzaW4sIHRvd2FyZHMpIHtcclxuXHRcdGxldCBjbG9ja3dpc2UgPSB0aGlzLmNyb3NzKHRvd2FyZHMpID4gMDtcclxuXHRcdGlmIChjbG9ja3dpc2UpXHJcblx0XHRcdHRoaXMucm90YXRlQnlDb3NTaW4oY29zLCBzaW4pO1xyXG5cdFx0ZWxzZVxyXG5cdFx0XHR0aGlzLnJvdGF0ZUJ5Q29zU2luKGNvcywgLXNpbik7XHJcblxyXG5cdFx0bGV0IGFmdGVyQ2xvY2t3aXNlID0gdGhpcy5jcm9zcyh0b3dhcmRzKSA+IDA7XHJcblx0XHRpZiAoY2xvY2t3aXNlICE9PSBhZnRlckNsb2Nrd2lzZSkge1xyXG5cdFx0XHRsZXQgbWFnbml0dWRlID0gdGhpcy5tYWduaXR1ZGU7XHJcblx0XHRcdHRoaXMueCA9IHRvd2FyZHMueDtcclxuXHRcdFx0dGhpcy55ID0gdG93YXJkcy55O1xyXG5cdFx0XHR0aGlzLm1hZ25pdHVkZSA9IG1hZ25pdHVkZTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBkaXN0YW5jZUZyb21TZWdtZW50VG9Qb2ludChzZWdtZW50U3RhcnQsIHNlZ21lbnRFbmQsIHBvaW50KSB7XHJcblx0XHRwb2ludC5zdWJ0cmFjdChzZWdtZW50U3RhcnQpO1xyXG5cdFx0c2VnbWVudEVuZC5zdWJ0cmFjdChzZWdtZW50U3RhcnQpO1xyXG5cdFx0bGV0IHQgPSBwb2ludC5kb3Qoc2VnbWVudEVuZCkgLyBzZWdtZW50RW5kLm1hZ25pdHVkZVNxcjtcclxuXHRcdHQgPSBjbGFtcCh0LCAwLCAxKTtcclxuXHRcdHNlZ21lbnRFbmQubXVsdGlwbHkodCk7XHJcblx0XHRyZXR1cm4gcG9pbnQuc3VidHJhY3Qoc2VnbWVudEVuZCkubWFnbml0dWRlO1xyXG5cdH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3I7XHJcbiIsImNvbnN0IExvb3BlciA9IHJlcXVpcmUoJy4uL2xvZ2ljL0xvb3BlcicpO1xuY29uc3QgR2FtZSA9IHJlcXVpcmUoJy4uL2xvZ2ljL0dhbWUnKTtcbmNvbnN0IEdhbWVFZ2cgPSByZXF1aXJlKCcuLi9sb2dpYy9HYW1lRWdnJyk7XG5jb25zdCBHcmFwaGljc0RlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9HcmFwaGljc0RlbW8nKTtcbmNvbnN0IFN0YXJmaWVsZERlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9TdGFyZmllbGREZW1vJyk7XG5jb25zdCBOb2lzZURlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9Ob2lzZURlbW8nKTtcbmNvbnN0IE1hcERlbW8gPSByZXF1aXJlKCcuLi9sb2dpYy9NYXBEZW1vJyk7XG5jb25zdCBJbnRlcmZhY2VEZW1vID0gcmVxdWlyZSgnLi4vbG9naWMvSW50ZXJmYWNlRGVtbycpO1xuY29uc3QgUmVjb3JkTXA0ID0gcmVxdWlyZSgnLi4vdXRpbC9SZWNvcmRNcDQnKTtcblxubGV0IGNhbnZhcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjYW52YXMnKTtcbmxldCBsb2dpY0J1dHRvbnNSb3cgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjbG9naWMtYnV0dG9ucy1yb3cnKTtcbmxldCBsb29wZXIgPSBuZXcgTG9vcGVyKGNhbnZhcyk7XG5cbmxldCBsb2dpY0NMYXNzZXMgPSBbXG5cdEdhbWUsXG5cdEdhbWVFZ2csXG5cdEdyYXBoaWNzRGVtbyxcbl07XG5cbmxvZ2ljQ0xhc3Nlcy5mb3JFYWNoKExvZ2ljQ2xhc3MgPT4ge1xuXHRsZXQgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG5cdGJ1dHRvbi50ZXh0Q29udGVudCA9IExvZ2ljQ2xhc3MubmFtZTtcblx0YnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXHRcdGxvb3Blci5zZXRMb2dpY0NsYXNzKExvZ2ljQ2xhc3MpO1xuXHRcdGhpc3RvcnkucmVwbGFjZVN0YXRlKG51bGwsICcnLCBgLyR7TG9naWNDbGFzcy5uYW1lfWApO1xuXHR9KTtcblx0bG9naWNCdXR0b25zUm93LmFwcGVuZChidXR0b24pO1xufSk7XG5cbmxldCBTdGFydExvZ2ljQ2xhc3MgPSBsb2dpY0NMYXNzZXMuZmluZChMb2dpY0NsYXNzID0+IGAvJHtMb2dpY0NsYXNzLm5hbWV9YCA9PT0gbG9jYXRpb24ucGF0aG5hbWUpIHx8IGxvZ2ljQ0xhc3Nlc1swXTtcbmxvb3Blci5zZXRMb2dpY0NsYXNzKFN0YXJ0TG9naWNDbGFzcyk7XG5cbi8vIHdpbmRvdy5yID0gUmVjb3JkTXA0O1xuLy8gd2luZG93LnMgPSBSZWNvcmRNcDQoKTtcbiJdfQ==
