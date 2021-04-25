import {rand, randB} from '../util/Number.js';
import Star from './Star.js';
import RectC from '../painter/elements/RectC.js';

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

export default Starfield;
