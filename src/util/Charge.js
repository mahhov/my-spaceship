const {clamp} = require('./Number');

class Charge {
	constructor(max, generateRate = 0) {
		this.value = this.max = max;
		this.generateRate = generateRate;
	}

	// return true if reached 0 or max
	generate() { // todo [high] rename increment
		return this.change(this.generateRate);
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
