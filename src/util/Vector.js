import {clamp, cos, PI2, rand, sin} from './number.js';

class Vector {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static fromObj({x, y}) {
		return new Vector(x, y);
	}

	static fromTheta(theta, magnitude = 1) {
		return new Vector(cos(theta) * magnitude, sin(theta) * magnitude);
	}

	static fromRand(maxMagnitude = 1, minMagnitude = 0) {
		return Vector.fromTheta(rand(PI2), minMagnitude + rand(maxMagnitude - minMagnitude));
	}

	get copy() {
		return Vector.fromObj(this);
	}

	add(v) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	subtract(v) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	negate() {
		this.x = -this.x;
		this.y = -this.y;
		return this;
	}

	multiply(scale) {
		this.x *= scale;
		this.y *= scale;
		return this;
	}

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	// positive if v is clockwise of this
	cross(v) {
		return this.x * v.y - this.y * v.x;
	}

	get magnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

	// todo [medium] check if any uses of magnitude can be replaced with magnitudeSqr
	get magnitude() {
		return Math.sqrt(this.magnitudeSqr);
	}

	set magnitude(magnitude) {
		let prevMagnitude = this.magnitude;
		if (!prevMagnitude) {
			this.x = magnitude;
			this.y = 0;
		} else {
			let mult = magnitude / prevMagnitude;
			this.multiply(mult);
		}
	}

	setMagnitude(magnitude) {
		this.magnitude = magnitude;
		return this;
	}

	// rotates clockwise
	rotateByCosSin(cos, sin) {
		let tempX = this.x;
		this.x = this.x * cos - this.y * sin;
		this.y = tempX * sin + this.y * cos;
		return this;
	}

	// assumes (cos, sin) represents a rotation (0, PI).
	rotateByCosSinTowards(cos, sin, towards) {
		let clockwise = this.cross(towards) > 0;
		if (clockwise)
			this.rotateByCosSin(cos, sin);
		else
			this.rotateByCosSin(cos, -sin);

		let afterClockwise = this.cross(towards) > 0;
		if (clockwise !== afterClockwise) {
			let magnitude = this.magnitude;
			this.x = towards.x;
			this.y = towards.y;
			this.magnitude = magnitude;
		}

		return this;
	}

	static distanceFromSegmentToPoint(segmentStart, segmentEnd, point) {
		point.subtract(segmentStart);
		segmentEnd.subtract(segmentStart);
		let t = point.dot(segmentEnd) / segmentEnd.magnitudeSqr;
		t = clamp(t, 0, 1);
		segmentEnd.multiply(t);
		return point.subtract(segmentEnd).magnitude;
	}
}

export default Vector;
