import makeEnum from '../../util/Enum.js';
import ModuleManager from './ModuleManager.js';

const PrimaryStages = makeEnum('PLAY', 'LOOP', 'PAUSE', 'STOP');
// variable number of secondary stages depending on number of patterns defined
// variable number of phases depending on number of periods defined

class patternedPeriod extends ModuleManager {
	config(periods, patterns, queues) {
		this.periods = periods;
		this.patterns = patterns;
		// When secondaryStage is set to i,
		// if queues[i] is true, will not update curPatternI to i until after curPatternI completes
		// else if queues[i] is false, will update curPatternI to i immediately.
		this.queues = queues;
		this.setCurPattern(0);
	}

	setCurPattern(patternI) {
		this.curPatternI = patternI;
		this.curPeriodI = 0;
		this.resetDuration();
	}

	get period() {
		return this.patterns[this.curPatternI][this.curPeriodI];
	}

	resetDuration() {
		this.curDuration = this.periods[this.period];
		if (this.curDuration)
			this.curDuration++;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage[0] === PrimaryStages.STOP)
			this.setCurPattern(0);

		else if (this.stage[0] !== PrimaryStages.PAUSE) {
			if (this.stage[1] !== this.curPatternI && (!this.queues[this.stage[1]] || !this.curDuration))
				this.setCurPattern(this.stage[1]);
			if (this.curDuration && !--this.curDuration) {
				if (this.curPeriodI < this.patterns[this.curPatternI].length - 1)
					this.curPeriodI++;
				else if (this.stage[1] !== this.curPatternI)
					this.setCurPattern(this.stage[1]);
				else if (this.stage[0] === PrimaryStages.LOOP)
					this.curPeriodI = 0;
				this.resetDuration();
			}
		}

		this.modulesSetStage(this.period);
	}
}

patternedPeriod.PrimaryStages = PrimaryStages;

export default patternedPeriod;
