import makeEnum from '../../util/enum.js';

import ModuleDeprecated from './ModuleDeprecated.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class PhaseSetter extends ModuleDeprecated {
	config(phase, phaseValue) {
		this.phase = phase;
		this.phaseValue = phaseValue;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.phase.setPhase(this.phaseValue);
	}
}

PhaseSetter.Stages = Stages;

export default PhaseSetter;
