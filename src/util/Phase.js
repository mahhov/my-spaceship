const {randInt} = require('./Number');

class Phase {
	// durations should be >= 0
	constructor(...durations) {
		this.durations = durations;
		this.setPhase(0);
	}

	setPhase(phase) {
		this.phase = phase;
		this.duration = this.durations[phase];
	}

	setRandomTick() {
		this.duration = randInt(this.durations[this.phase]) + 1;
	}

	nextPhase() {
		this.setPhase(++this.phase < this.durations.length ? this.phase : 0);
	}

	// return true if phase ends (e.g., duration equaled 1)
	tick() {
		return this.duration && !--this.duration;
	}

	// return true if phase ends (see tick())
	// if tick = 0, will remain 0 and phase will not iterate
	sequentialTick() {
		if (this.tick()) {
			this.nextPhase();
			return true;
		}
	}

	isNew() {
		return this.duration === this.durations[phsae];
	}

	get() {
		return this.phase;
	}

	// starts at 0, increases to 1
	getRatio() {
		return 1 - this.duration / this.durations[this.phase];
	}
}

module.exports = Phase;
