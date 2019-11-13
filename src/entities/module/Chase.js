const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed, skirmishTime, skirmishDistance, rotationSpeed) {
		this.origin = origin;
		this.speed = speed;
		this.skirmishTime = skirmishTime;
		this.skirmishDistance = skirmishDistance;
		this.rotationSpeed = rotationSpeed; // 0 means instant rotation
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));

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

		if (!this.rotation)
			this.rotation = Vector.fromObj(delta);
		else if (this.rotationSpeed)
			this.rotation.rotateByCosSinTowards(Math.cos(this.rotationSpeed), Math.sin(this.rotationSpeed), delta);
		else
			this.rotation = delta;

		this.origin.safeMove(intersectionFinder, this.rotation.x, this.rotation.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;
