import Stat from '../playerData/Stat.js';
import Pool from '../util/Pool.js';
import Entity from './Entity.js';
import StatManager from './StatManager.js';

class LivingEntity extends Entity {
	constructor(x, y, width, height, baseStats, statValues, layer) {
		super(x, y, width, height, layer);
		this.statManager = new StatManager(baseStats, [statValues]);
		this.health = new Pool(this.statManager.getBasedStat(Stat.Ids.LIFE));
	}

	refresh() {
		this.statManager.tickBuffs();
	}

	changeHealth(amount) {
		if (amount < 0)
			amount /= this.statManager.getBasedStat(Stat.Ids.ARMOR);
		this.health.change(amount);
	}

	restoreHealth() {
		this.health.restore();
	}

	onKill(monster) {
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

export default LivingEntity;
