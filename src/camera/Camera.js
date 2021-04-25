import {clamp, avg} from '../util/Number.js';

class Camera {
	constructor(x, y, z = 2) {
		this.x = x;
		this.y = y;
		this.endZ = this.z = z;
		this.s0 = this.calcS(0);
	}

	static createForRegion(fromScale, toLeft, toTop, toScale) {
		let invScale = fromScale / toScale;
		return new Camera((.5 - toLeft) * invScale, (.5 - toTop) * invScale, invScale);
	}

	// center range [[0, width], [0, height]]
	// adjustment range [[0, 1], [0, 1]]
	move(center, adjustment) {
		const ADJUSTMENT_WEIGHT = .5, FILTER_WEIGHT = .93;
		let x = center.x + (adjustment.x - .5) * ADJUSTMENT_WEIGHT;
		let y = center.y + (adjustment.y - .5) * ADJUSTMENT_WEIGHT;
		this.x = avg(this.x, x, FILTER_WEIGHT);
		this.y = avg(this.y, y, FILTER_WEIGHT);
	}

	zoom(zoomOut, zoomIn) {
		const ZOOM_RATE = .2, MIN_Z = 1, MAX_Z = 10, FILTER_WEIGHT = .93;
		let dz = zoomOut - zoomIn;
		if (dz)
			this.endZ = clamp(this.endZ + dz * ZOOM_RATE, MIN_Z, MAX_Z);
		this.z = avg(this.z, this.endZ, FILTER_WEIGHT);
		this.s0 = this.calcS(0);
	}

	calcS(dz) {
		return 1 / (this.z + dz);
	}

	getS(dz) {
		return dz ? this.calcS(dz) : this.s0;
	}

	xt(x, dz = 0) {
		return (x - this.x) * this.getS(dz) + .5;
	}

	yt(y, dz = 0) {
		return (y - this.y) * this.getS(dz) + .5;
	}

	st(size, dz = 0) {
		return size * this.getS(dz);
	}

	xit(x) {
		return this.x + (x - .5) * this.z;
	}

	yit(y) {
		return this.y + (y - .5) * this.z;
	}
}

export default Camera;
