const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude, setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const NEAR_PHASE = 0, MIDDLE_PHASE = 1, FAR_PHASE = 2;

class Chase extends ModuleManager {
	config(nearDistance, farDistance, speed, origin) {
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
		this.speed = speed;
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let {x: dx, y: dy, prevMagnitude: targetDistance} = setMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		if (targetDistance < this.nearDistance)
			this.modulesSetStage(NEAR_PHASE);
		else if (targetDistance > this.farDistance)
			this.modulesSetStage(FAR_PHASE);
		else {
			this.modulesSetStage(MIDDLE_PHASE);
			this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
		}

		this.modulesApply(map, intersectionFinder, target);
	}
}

Chase.Stages = Stages;

module.exports = Chase;
