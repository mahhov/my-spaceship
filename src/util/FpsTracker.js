const {round} = require('./Number');

class FpsTracker {
	constructor() {
		this.fps = 0;
	}

	tick() {
		let now = performance.now();
		let passed = now - this.start;
		if (!(passed < 1000)) {
			this.start = now;
			this.fps = this.ticks * 1000 / passed;
			this.ticks = 0;
		}
		this.ticks++;
	}

	getFps() {
		this.tick();
		return round(this.fps);
	}
}

module.exports = FpsTracker;
