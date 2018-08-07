const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('ENGAGED', 'DISENGAGED');

class Engage extends ModuleManager {
	config(origin, nearDistance, farDistance) {
		this.origin = origin;
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		if (targetDistance < this.nearDistance)
			this.modulesSetStage(Phases.ENGAGED);
		else if (targetDistance > this.farDistance)
			this.modulesSetStage(Phases.DISENGAGED);

		this.modulesApply(map, intersectionFinder, target);
	}
}

Engage.Stages = Stages;
Engage.Phases = Phases;

module.exports = Engage;
