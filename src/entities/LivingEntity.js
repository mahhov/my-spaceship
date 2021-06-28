import Stat from '../playerData/Stat.js';
import Pool from '../util/Pool.js';
import Entity from './Entity.js';

class LivingEntity extends Entity {
	constructor(x, y, width, height, baseStats, layer) {
		super(x, y, width, height, layer);
		this.baseStats = baseStats;
		this.buffs = [];
	}

	applyInitialBuffs() {
		// should be invoked once after buffs are set
		this.health = new Pool(this.getBasedStat(Stat.Ids.LIFE));
	}

	refresh() {
		this.tickBuffs();
	}

	changeHealth(amount) {
		this.health.change(amount / this.getBasedStat(Stat.Ids.ARMOR));
	}

	restoreHealth() {
		this.health.restore();
	}

	onKill(monster) {
	}

	addBuff(buff) {
		if (this.buffs.indexOf(buff) === -1) {
			this.buffs.push(buff);
			return true;
		}
	}

	getStat(statId) {
		let value = this.buffs
			.map(buff => buff.statValues.get(statId))
			.reduce((a, b) => a + b, 0);
		return statId === Stat.Ids.DISABLED ? value : value + 1;
	}

	getBasedStat(statId) {
		return this.baseStats[statId] * this.getStat(statId);
	}

	tickBuffs() {
		this.buffs = this.buffs.filter(buff => !buff.tick());
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

export default LivingEntity;
