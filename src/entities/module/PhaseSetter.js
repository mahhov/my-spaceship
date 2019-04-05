const makeEnum = require('../../util/Enum');
const Trigger = require('../../util/Trigger');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER');

// If stage is set to ACTIVE, will set this.phase to this.phaseValue
// If stage is TRIGGER, will set this.phase to this.phaseValue once (since last INACTIVE stage)

class PhaseSetter extends Module {
	constructor() {
		super();
		this.trigger = new Trigger(Stages.TRIGGER);
	}

	config(phase, phaseValue) {
		this.phase = phase;
		this.phaseValue = phaseValue;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE || this.trigger.trigger(this.stage))
			this.phase.setPhase(this.phaseValue);
		else if (this.stage === Stages.INACTIVE)
			this.trigger.untrigger();
	}
}

PhaseSetter.Stages = Stages;

module.exports = PhaseSetter;
