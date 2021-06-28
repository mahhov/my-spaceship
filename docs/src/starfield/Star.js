import Rect from '../painter/elements/Rect.js';
import {Colors} from '../util/Constants.js';
import Coordinate from '../util/Coordinate.js';
import {rand, randInt} from '../util/number.js';

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

		let coordinate = new Coordinate(x, y, s).align(Coordinate.Aligns.CENTER);
		let color = STAR_COLOR_ARRAY[this.blue ? 1 : 0][this.flicker ? 1 : 0];
		painter.add(new Rect(coordinate).setOptions({fill: true, color: color.get()}));
	}
}

export default Star;
