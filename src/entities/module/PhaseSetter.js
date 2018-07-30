const makeEnum = require('../../util/Enum');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class PhaseSetter extends Module {
	config(phase, phaseValue) {
		this.phase = phase;
		this.phaseValue = phaseValue;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.phase.setPhase(this.phaseValue);
	}
}

PhaseSetter.Stages = Stages;

module.exports = PhaseSetter;
