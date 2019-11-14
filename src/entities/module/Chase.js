const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {cos, sin} = require('../../util/Number');
const Vector = require('../../util/Vector');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'REVERSE');

class Chase extends Module {
	config(origin, speed, skirmishTime, skirmishDistance, rotationSpeed) {
		this.origin = origin;
		this.speed = speed;
		this.skirmishTime = skirmishTime;
		this.skirmishDistance = skirmishDistance;
		this.rotationSpeedCos = cos(rotationSpeed); // 0 rotationSpeed means instant rotation
		this.rotationSpeedSin = sin(rotationSpeed);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
		if (this.stage === Stages.REVERSE)
			delta.negate();

		if (this.skirmishTime) {
			if (!this.skirmishTick) {
				this.skirmishTick = this.skirmishTime;
				this.skirmishVec = Vector.fromRand(this.skirmishDistance);
				if (this.skirmishVec.dot(delta) > 0)
					this.skirmishVec.negate();
			}
			this.skirmishTick--;
			delta.add(this.skirmishVec);
		}

		if (!this.rotation) {
			this.rotation = Vector.fromObj(delta);
			this.rotation.magnitude = 1;
		} else if (this.rotationSpeed)
			this.rotation.rotateByCosSinTowards(this.rotationSpeedCos, this.rotationSpeedSin, delta);
		else {
			this.rotation = delta;
			this.rotation.magnitude = 1;
		}

		this.origin.safeMove(intersectionFinder, this.rotation.x, this.rotation.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;
