class StatValues {
	constructor() {
		this.stats = [];
	}

	add(statId, value) {
		this.stats[statId] ||= 0;
		this.stats[statId] += value;
	}

	addStatItem(statItem) {
		statItem.stats.forEach(stat => this.add(stat.id, stat.value));
	}

	addAllocation(allocation) {
		allocation.stats.forEach(stat => this.add(stat.id, allocation.value * stat.value));
	}

	get(statId) {
		return this.stats[statId] || 0;
	}
}

export default StatValues;
