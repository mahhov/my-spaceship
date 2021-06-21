import StatItem from './StatItem.js';

class Allocation extends StatItem {
	constructor(name, stats, maxValue) {
		super(null, name, stats);
		this.value = 0;
		this.maxValue = maxValue;
	}

	get valueText() {
		return `${this.value}/${this.maxValue}`;
	}

	get descriptionText() {
		return this.stats.map(stat => stat.descriptionText);
	}
}

export default Allocation;
