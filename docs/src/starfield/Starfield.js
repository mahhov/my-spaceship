import {rand, randB} from '../util/number.js';
import Star from './Star.js';

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
		// let coordinate = new Coordinate(0, 0, 1);
		// painter.add(new Rect(coordinate).setOptions( {fill: true}));
		this.stars.forEach(star => star.paint(painter, camera));
	}
}

export default Starfield;
