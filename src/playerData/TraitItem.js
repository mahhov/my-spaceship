class TraitItem {
	constructor(name, stats, value, maxValue, description) {
		this.name = name;
		this.stats = stats;
		this.value = value;
		this.maxValue = maxValue;
		this.description = description;
	}

	get valueText() {
		return `${this.value}/${this.maxValue}`;
	}
}

export default TraitItem;
