class StatItem {
	constructor(type, name, stats) {
		this.type = type;
		this.name = name;
		this.stats = stats;
	}

	get uiLines() {
		return [
			this.name,
			...this.stats.map(stat => stat.descriptionText),
		];
	}
}

export default StatItem;
