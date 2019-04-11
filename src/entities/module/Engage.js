const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('ENGAGED', 'DISENGAGED');

// engages when target becomes closer than nearDistance
// disengages when target becomes farther than farDistance
// does not change phase if target is in between nearDistance and farDistance
class Engage extends ModuleManager {
	config(origin, nearDistance, farDistance) {
		this.origin = origin;
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		if (targetDistance < this.nearDistance)
			this.modulesSetStage(Phases.ENGAGED);
		else if (targetDistance > this.farDistance)
			this.modulesSetStage(Phases.DISENGAGED);
	}
}

Engage.Stages = Stages;
Engage.Phases = Phases;

module.exports = Engage;
