const {avg} = require('../util/Number');

class Camera {
	constructor() {
		this.x = .5;
		this.y = .5;
		this.zoom(1);
	}

	move(center, adjustment) {
		const ADJUSTMENT_WEIGHT = .5, FILTER_WEIGHT = .93;
		let x = center.x + (adjustment.x - .5) * ADJUSTMENT_WEIGHT;
		let y = center.y + (adjustment.y - .5) * ADJUSTMENT_WEIGHT;
		this.x = avg(this.x, x, FILTER_WEIGHT);
		this.y = avg(this.y, y, FILTER_WEIGHT);
	}

	zoom(z) {
		this.z = z;
		this.s = 1 / this.z;
	}

	xt(x) {
		return (x - this.x) * this.s + .5;
	}

	yt(y) {
		return (y - this.y) * this.s + .5;
	}

	st(s) {
		return s * this.s;
	}

	xit(x) {
		return this.x + (x - .5) * this.z;
	}

	yit(y) {
		return this.y + (y - .5) * this.z;
	}
}

module.exports = Camera;
