const Starfield = require('./Starfield');
const Noise = require('../util/Noise');
const {rand} = require('../util/Number');
const Star = require('./Star');
const RectC = require('../painter/RectC');

// this class is only for the StarfieldDemo
class StarfieldNoise extends Starfield {
	constructor(width, height, extra = 0) {
		super(0, 0, 0);

		const DEPTH = 20 + extra & 20, FORWARD_DEPTH = .8,
			WIDTH = width * DEPTH, HEIGHT = height * DEPTH,
			COUNT = 10 * WIDTH * HEIGHT,
			SIZE = .03 + extra * .03, BLUE_RATE = .05;

		let noise = new Noise();
		let countSqrt = Math.sqrt(COUNT);

		this.stars = [];
		for (let xi = 0; xi < countSqrt; xi++)
			for (let yi = 0; yi < countSqrt; yi++) {
				let x = (xi / countSqrt - .5) * WIDTH;
				let y = (yi / countSqrt - .5) * HEIGHT;
				let n = noise.get(xi / countSqrt, yi / countSqrt);
				if (n < rand() / 2)
					continue;
				let z = rand(DEPTH);
				if (x > z || x < -z || y > z || y < -z)
					continue;
				let size = rand(SIZE);
				this.stars.push(new Star(x, y, z, size, rand() < BLUE_RATE));
			}
	}
}

module.exports = StarfieldNoise;
