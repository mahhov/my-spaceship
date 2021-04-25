import makeEnum from '../../util/Enum.js';
import ModuleManager from './ModuleManager.js';
import Phase from '../../util/Phase.js';

const Stages = makeEnum('PLAY', 'LOOP', 'PAUSE', 'STOP');
// variable number of phases per number of arguments to config

class Period extends ModuleManager {
	config(...periods) {
		this.periodCount = periods.length;
		this.periods = new Phase(...periods, 0);
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.STOP)
			this.periods.setPhase(0);

		else if (this.stage !== Stages.PAUSE) {
			this.periods.sequentialTick();
			if (this.periods.get() === this.periodCount && this.stage === Stages.LOOP)
				this.periods.setPhase(0);
		}

		this.modulesSetStage(this.periods.get());
	}
}

Period.Stages = Stages;

export default Period;
