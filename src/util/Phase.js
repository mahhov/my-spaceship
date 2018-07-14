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
		return --this.duration ? this.phase : -1;
	}

	get() {
		return this.phase;
	}

	complete() {
		return !this.duration;
	}
}

module.exports = Phase;