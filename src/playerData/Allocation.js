import Stat from './Stat.js';
import StatItem from './StatItem.js';

class Allocation extends StatItem {
	constructor(name, stats, maxValue, statIds = Stat.Ids, description = '') {
		super(null, name, stats);
		this.value = 0;
		this.maxValue = maxValue;
		this.statIds = statIds;
		this.description = description;
	}

	get valueText() {
		return `${this.value}/${this.maxValue}`;
	}

	get descriptionText() {
		return [
			this.description,
			...this.stats.map(stat => stat.getDescriptionText(this.statIds)),
		].filter(v => v);
	}
}

export default Allocation;
