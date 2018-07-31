const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
const Phases = makeEnum('ENGAGED', 'DISENGAGED');

class Engage extends ModuleManager {
	config(nearDistance, farDistance, origin) {
		this.nearDistance = nearDistance;
		this.farDistance = farDistance;
		this.origin = origin;
		this.phase = -1;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		if (targetDistance < this.nearDistance)
			this.setPhase(Phases.ENGAGED);
		else if (targetDistance > this.farDistance)
			this.setPhase(Phases.DISENGAGED);

		this.modulesApply(map, intersectionFinder, target);
	}

	setPhase(phase) {
		if (phase !== this.phase)
			this.modulesSetStage(this.phase = phase);
	} // todo move to module manager and reuuse for chase.
}

Engage.Stages = Stages;
Engage.Phases = Phases;

module.exports = Engage;
