import BaseStats from '../playerData/BaseStats.js';

class StatManager {
	constructor(baseStats, statValuesSets, buffs = []) {
		this.baseStats = baseStats;
		this.statValueSets = statValuesSets;
		this.buffs = buffs;
	}

	extend(statValues) {
		return new StatManager(this.baseStats, [...this.statValueSets, statValues], this.buffs);
	}

	mergeBaseStats(baseStats) {
		this.baseStats = new BaseStats({...this.baseStats.tuples, ...baseStats.tuples});
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

	// todo [low] deprecate and use getBasedStat everywhere
	getStat(statId) {
		return [...this.statValueSets, ...this.buffs.map(buff => buff.statValues)]
			.map(statValues => statValues.get(statId))
			.reduce((a, b) => a + b, 0);
	}

	getBasedStat(statId) {
		return this.baseStats.getBasedStat(statId, this.getStat(statId));
	}
}

export default StatManager;
