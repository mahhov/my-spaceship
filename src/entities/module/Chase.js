const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude, setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('NEAR', 'MIDDLE', 'FAR');

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
			this.modulesSetStage(Phases.NEAR);
		else if (targetDistance > this.farDistance)
			this.modulesSetStage(Phases.FAR);
		else {
			this.modulesSetStage(Phases.MIDDLE);
			this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
		}

		this.modulesApply(map, intersectionFinder, target);
	}
}

Chase.Stages = Stages;
Chase.Phases = Phases;

module.exports = Chase;
