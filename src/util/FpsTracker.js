import {round} from './Number.js';

class FpsTracker {
	constructor() {
		this.fps = 0;
		this.start = 0;
	}

	tick() {
		let now = performance.now();
		let passed = now - this.start;
		if (passed >= 1000) {
			this.start = now;
			this.fps = this.ticks * 1000 / passed;
			this.ticks = 0;
		}
		this.ticks++;
	}

	getFps() {
		return round(this.fps);
	}
}

export default FpsTracker;
