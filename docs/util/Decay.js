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

	decay() {
		if (this.value > 0)
			this.value = Math.max(this.value - this.decayRate, 0);
	}

	get() {
		return this.value / this.max;
	}
}

export default Decay;
