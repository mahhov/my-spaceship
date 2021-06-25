import StatItem from './StatItem.js';

class Allocation extends StatItem {
	constructor(name, stats, maxValue, description = '') {
		super(null, name, stats);
		this.value = 0;
		this.maxValue = maxValue;
		this.description = description;
	}

	get valueText() {
		return `${this.value}/${this.maxValue}`;
	}

	get descriptionText() {
		return [
			this.description,
			...this.stats.map(stat => stat.getDescriptionText()),
		].filter(v => v);
	}
}

export default Allocation;
