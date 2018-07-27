const Color = require('../util/Color');
const {rand, randInt} = require('../util/Number');
const RectC = require('../painter/RectC');

const STAR_COLOR = Color.from1(1, 1, 1), STAR_FLICKER_COLOR = STAR_COLOR.multiply(.7);
const STAR_BLUE_COLOR = Color.from1(.8, .8, 1), STAR_FLICKER_BLUE_COLOR = STAR_BLUE_COLOR.multiply(.7);
const STAR_COLOR_ARRAY = [[STAR_COLOR, STAR_FLICKER_COLOR], [STAR_BLUE_COLOR, STAR_FLICKER_BLUE_COLOR]];

class Star {
	constructor(x, y, z, size, blue) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.size = size;
		this.blue = blue;
	}

	paint(painter, camera) {
		const FLICKER_RATE = .003, FLICKER_COLOR = .7;

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
