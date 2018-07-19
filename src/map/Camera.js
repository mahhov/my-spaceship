class Camera {
	constructor() {
		this.move(.5, .5);
		this.zoom(1);
	}

	move(center, adjustment) {
		const ADJUSTMENT_WEIGHT = .5;
		let x = center.x + (adjustment.x - .5) * ADJUSTMENT_WEIGHT;
		let y = center.y + (adjustment.y - .5) * ADJUSTMENT_WEIGHT;

		if (this.x === x && this.y === y)
			return;
		this.x = x;
		this.y = y;
	}

	zoom(z) {
		if (this.z === z)
			return;
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
