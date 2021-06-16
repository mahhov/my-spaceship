import {toUiString} from '../util/string.js';

class Trait {
	constructor(name, stats, value, maxValue) {
		this.name = name;
		this.stats = stats;
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
