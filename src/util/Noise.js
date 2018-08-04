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

	// retun count number of points within range [[0 - width], [0 - height]], structured as 2d array
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
