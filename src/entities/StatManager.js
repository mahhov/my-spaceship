import Stat from '../playerData/Stat.js';

class StatManager {
	constructor(baseStats, statValues) {
		this.baseStats = baseStats;
		this.statValues = statValues;
		this.buffs = [];
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

	getStat(statId) {
		let value = [this.statValues, ...this.buffs.map(buff => buff.statValues)]
			.map(statValues => statValues.get(statId))
			.reduce((a, b) => a + b, 0);
		return statId === Stat.Ids.DISABLED ? value : value + 1;
	}

	getBasedStat(statId) {
		return this.baseStats[statId] * this.getStat(statId);
	}
}

export default StatManager;