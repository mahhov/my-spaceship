const makeEnum = require('../../util/Enum');
const AttackModule = require('./AttackModule');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends AttackModule { // todo rename attack module
	config(nearDistance, farDistance, speed, origin) {
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
		this.speed = speed;
		this.origin = origin;
	}

	apply(logic, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let dx = target.x - this.origin.x;
		let dy = target.y - this.origin.y;
		let targetDistance = getMagnitude(dx, dy);

		if (targetDistance > this.nearDistance && targetDistance < this.farDistance) {
			this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
		}
	}
}

Chase.Stages = Stages;

module.exports = Chase;
