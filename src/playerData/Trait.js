import {toUiString} from '../util/string.js';
import StatItem from './StatItem.js';

class Trait extends StatItem {
	constructor(name, stats, value, maxValue) {
		super(null, name, stats);
		this.value = value;
		this.maxValue = maxValue;
	}

	get valueText() {
		return `${this.value}/${this.maxValue}`;
	}

	get descriptionText() {
		return toUiString(this.stats.map(stat => stat.descriptionText).join('; '));
	}
}

export default Trait;
