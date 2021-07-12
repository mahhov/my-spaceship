import makeEnum from '../../util/enum.js';
import Module2 from './Module2.js';

const Stages = makeEnum({STOP: 0, PLAY: 0, LOOP: 0, PAUSE: 0});

class PatternedPeriod extends Module2 {
	config(periods, patterns, queues) {
		this.periods = periods;
		this.patterns = patterns;
		// if queues[nextPatternI] is true, will not update curPatternI to curPatternI until after curPatternI completes
		// else if queues[nextPatternI] is false, will update curPatternI to nextPatternI immediately.
		this.queues = queues;
		this.nextPatternI = 0;
	}

	setPattern(patternI) {
		this.nextPatternI = patternI;
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

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.STOP)
			this.setCurPattern(0);

		else if (this.stage !== Stages.PAUSE) {
			if (this.nextPatternI !== this.curPatternI && (!this.queues[this.nextPatternI] || !this.curDuration))
				this.setCurPattern(this.nextPatternI);
			if (this.curDuration && !--this.curDuration) {
				if (this.curPeriodI < this.patterns[this.curPatternI].length - 1)
					this.curPeriodI++;
				else if (this.nextPatternI !== this.curPatternI)
					this.setCurPattern(this.nextPatternI);
				else if (this.stage === Stages.LOOP)
					this.curPeriodI = 0;
				this.resetDuration();
			}
		}

		this.emit('change', this.period);
	}
}

PatternedPeriod.Stages = Stages;

export default PatternedPeriod;
