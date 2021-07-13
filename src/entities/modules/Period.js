import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Module from './Module.js';

const Stages = makeEnum({STOP: 0, PLAY: 0, LOOP: 0, PAUSE: 0});

class Period extends Module {
	config(...periods) {
		this.periodCount = periods.length;
		this.periods = new Phase(...periods, 0);
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.STOP)
			this.periods.setPhase(0);

		else if (this.stage !== Stages.PAUSE) {
			this.periods.sequentialTick();
			if (this.periods.get() === this.periodCount && this.stage === Stages.LOOP)
				this.periods.setPhase(0);
		}

		this.emit('change', this.periods.get());
	}
}

Period.Stages = Stages;

export default Period;
