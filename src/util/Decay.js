class Decay {
	constructor(max, decayRate) {
		this.max = max;
		this.decayRate = decayRate;
		this.value = 0;
	}

	add(amount) {
		if (amount > 0)
			this.value = Math.min(this.value + amount, this.max + this.decayRate);
	}

	get() {
		if (this.value > 0)
			this.value = Math.max(this.value - this.decayRate, 0);
		return this.value / this.max;
	}
}

module.exports = Decay;
