const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const {thetaToVector, cos, sin} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'REVERSE');

// todo[high] use Aim in chase and shotgun
class Aim extends Module {
	config(origin, rotationSpeed, initialDirVector = new Vector(1, 0)) {
		this.origin = origin;
		this.rotationSpeedCos = cos(rotationSpeed); // 0 rotationSpeed means instant rotation
		this.rotationSpeedSin = sin(rotationSpeed);
		this.dir = initialDirVector;
		this.dir.magnitude = 1;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
		if (this.stage === Stages.REVERSE)
			delta.negate();

		if (this.rotationSpeed)
			this.dir.rotateByCosSinTowards(this.rotationSpeedCos, this.rotationSpeedSin, delta);
		else {
			this.dir = delta;
			this.dir.magnitude = 1;
		}
	}
}

Aim.Stages = Stages;

module.exports = Aim;
