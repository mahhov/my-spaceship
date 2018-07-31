const {clamp} = require('./Number');

class Charge {
	constructor(max, incrementRate = 0) {
		this.value = this.max = max;
		this.incrementRate = incrementRate;
	}

	// return true if reached 0 or max
	increment() {
		return this.change(this.incrementRate);
	}

	restore() {
		this.value = this.max;
	}

	// return true if reached 0 or max
	change(amount) {
		this.value = clamp(this.value + amount, 0, this.max);
		return this.value === 0 || this.value === this.max;
	}

	get() {
		return this.value;
	}

	getMax() {
		return this.max;
	}

	getMissing() {
		return this.max - this.value;
	}

	getRatio() {
		return this.value / this.max;
	}

	getMissingRatio() {
		return this.getMissing() / this.max;
	}

	isFull() {
		return this.value === this.max;
	}

	isEmpty() {
		return !this.value;
	}
}

module.exports = Charge;

// todo [medium] rename this class
