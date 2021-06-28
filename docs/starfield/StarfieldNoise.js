import {NoiseSimplex} from '../util/noise.js';
import {rand} from '../util/number.js';
import Star from './Star.js';
import Starfield from './Starfield.js';

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

export default StarfieldNoise;
