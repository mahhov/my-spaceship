class Phase {
	// durations should be > 0
	constructor(...durations) {
		this.durations = durations;
	}

	setPhase(phase) {
		this.phase = phase;
		this.duration = this.durations[phase];
	}

	nextPhase() {
		this.setPhase(++this.phase < this.durations.length ? this.phase : 0);
	}

	tick() {
		this.duration && this.duration--;
	}

	sequentialTick() {
		if (this.isComplete())
			this.nextPhase();
		this.tick();
	}

	get() {
		return this.phase;
	}

	// starts at 0, increases to 1
	getRatio() {
		return 1 - this.duration / this.durations[this.phase];
	}

	isComplete() {
		return !this.duration;
	}
}

module.exports = Phase;