const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');

const Stages = makeEnum('PLAY', 'LOOP', 'PAUSE', 'STOP');
// variable number of phases per number of arguments to config

class Period extends ModuleManager {
	config(...periods) {
		this.periodCount = periods.length;
		this.phase = new Phase(...periods, 0);
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage === Stages.STOP)
			this.phase.setPhase(0);

		else if (this.stage !== PAUSE) {
			this.phase.sequentialTick();
			if (this.phase.get() === this.periodCount && this.stage === 'LOOP')
				this.phase.setPhase(0);
		}

		this.modulesSetStage(this.phase.get());
	}
}

Period.Stages = Stages;

module.exports = Period;
