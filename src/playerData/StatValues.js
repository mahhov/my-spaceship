class StatValues {
	constructor() {
		this.stats = [];
	}

	add(statId, value) {
		this.stats[statId] ||= 0;
		this.stats[statId] += value;
	}

	get(statId) {
		return this.stats[statId] || 0;
	}
}

export default StatValues;
