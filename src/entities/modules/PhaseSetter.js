import makeEnum from '../../util/Enum.js';

import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class PhaseSetter extends Module {
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
