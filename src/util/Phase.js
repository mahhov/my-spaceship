const {randInt} = require('./Number');

class Phase {
	// durations should be > 0
	constructor(...durations) {
		this.durations = durations;
		this.setPhase(0);
	}

	setPhase(phase) {
		this.phase = phase;
		this.duration = this.durations[phase];
	}

	setPhaseWithRandomTick(phase) {
		this.phase = phase;
		this.duration = randInt(this.durations[phase]) + 1;
	}

	nextPhase() {
		this.setPhase(++this.phase < this.durations.length ? this.phase : 0);
	}

	// return true if phase ends
	tick() {
		return this.duration && !--this.duration;
	}

	// return true if phase ends
	sequentialTick() {
		if (this.tick()) {
			this.nextPhase();
			return true;
		}
	}

	get() {
		return this.phase;
	}

	// starts at 0, increases to 1
	getRatio() {
		return 1 - this.duration / this.durations[this.phase];
	}

	isComplete() { // todo remove this, only leaving temporarily to support boss1 during it's transformation to modules
		return this.duration === 0 || this.duration === this.durations[this.phase];
	}
}

module.exports = Phase;
