const {clamp, avg} = require('../util/Number');
const Keymapping = require('../control/Keymapping');

class Camera {
	constructor() {
		this.x = .5;
		this.y = .5;
		this.endZ = this.z = 3;
	}

	move(center, adjustment) {
		const ADJUSTMENT_WEIGHT = .5, FILTER_WEIGHT = .93;
		let x = center.x + (adjustment.x - .5) * ADJUSTMENT_WEIGHT;
		let y = center.y + (adjustment.y - .5) * ADJUSTMENT_WEIGHT;
		this.x = avg(this.x, x, FILTER_WEIGHT);
		this.y = avg(this.y, y, FILTER_WEIGHT);
	}

	zoom(controller, keymapping) {
		const ZOOM_RATE = .2, MIN_Z = 1, MAX_Z = 10, FILTER_WEIGHT = .93;
		let dz = keymapping.isActive(controller, Keymapping.Keys.ZOOM_OUT) - keymapping.isActive(controller, Keymapping.Keys.ZOOM_IN);
		if (dz)
			this.endZ = clamp(this.endZ + dz * ZOOM_RATE, MIN_Z, MAX_Z);
		this.z = avg(this.z, this.endZ, FILTER_WEIGHT);
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
