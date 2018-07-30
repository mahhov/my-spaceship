const {clamp} = require('./Number');

class Charge {
	constructor(max, generateRate = 0) {
		this.value = this.max = max;
		this.generateRate = generateRate;
	}

	generate() {
		this.change(this.generateRate);
	}

	change(amount) {
		this.value = clamp(this.value + amount, 0, this.max);
	}

	get() {
		return this.value;
	}

	getRatio() {
		return this.value / this.max;
	}

	isFull() {
		return this.value === this.max;
	}

	isEmpty() {
		return !this.value;
	}
}

module.exports = Charge;
