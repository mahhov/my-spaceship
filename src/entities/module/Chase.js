const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {getMagnitude, setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(nearDistance, farDistance, speed, origin) {
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
		this.speed = speed;
		this.origin = origin;
	}

	apply(logic, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let [dx, dy, targetDistance] = setMagnitude(target.x - this.origin.x, target.y - this.origin.y);
		if (targetDistance > this.nearDistance && targetDistance < this.farDistance)
			this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
	}
}

Chase.Stages = Stages;

module.exports = Chase;
