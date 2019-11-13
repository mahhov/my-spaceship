const {PI2, cos, sin, rand} = require('./Number');

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

	static fromRand(maxMagnitude = 1) {
		return Vector.fromTheta(rand(PI2), rand(maxMagnitude))
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

	dot(v) {
		return this.x * v.x + this.y * v.y;
	}

	cross(v) {
		return this.x * v.y - this.y * v.x;
	}

	get magnitudeSqr() {
		return this.x * this.x + this.y * this.y;
	}

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
			this.x *= mult;
			this.y *= mult;
		}
		return prevMagnitude;
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
}

module.exports = Vector;
