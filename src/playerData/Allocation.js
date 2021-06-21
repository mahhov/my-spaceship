import {toUiString} from '../util/string.js';
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
		// todo [high] multiline
		return toUiString(this.stats.map(stat => stat.descriptionText).join('; '));
	}
}

export default Allocation;
