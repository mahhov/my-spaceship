class StatManager {
	constructor(baseStats, statValuesSets, buffs = []) {
		this.baseStats = baseStats;
		this.statValueSets = statValuesSets;
		this.buffs = buffs;
	}

	extend(baseStats, statValues) {
		return new StatManager(
			{...this.baseStats, ...baseStats},
			[...this.statValueSets, statValues],
			this.buffs);
	}

	addBuff(buff) {
		if (this.buffs.indexOf(buff) === -1) {
			this.buffs.push(buff);
			return true;
		}
	}

	tickBuffs() {
		this.buffs = this.buffs.filter(buff => !buff.tick());
	}

	// todo [high] deprecate and use getBasedStat everywhere
	getStat(statId) {
		return [...this.statValueSets, ...this.buffs.map(buff => buff.statValues)]
			.map(statValues => statValues.get(statId))
			.reduce((a, b) => a + b, 0);
	}

	getBasedStat(statId) {
		let base = this.baseStats[statId];
		return base[0] * (base[1] + this.getStat(statId));
	}
}

export default StatManager;
