const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed, skirmishTime, skirmishDistance) {
		this.origin = origin;
		this.speed = speed;
		this.skirmishTime = skirmishTime;
		this.skirmishDistance = skirmishDistance;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
		delta.magnitude = 1;

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

		this.origin.safeMove(intersectionFinder, delta.x, delta.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;
