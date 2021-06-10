import Stat from '../playerData/Stat.js';
import Pool from '../util/Pool.js';
import Buff from './Buff.js';
import Entity from './Entity.js';

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
		this.buffs = [];
	}

	refresh() {
		this.tickBuffs();
	}

	changeHealth(amount) {
		this.health.change(amount / (1 + Buff.sum(this.buffs, Stat.Ids.ARMOR)));
	}

	restoreHealth() {
		this.health.restore();
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

	removeUi() {
		return this.health.isEmpty();
	}
}

export default LivingEntity;
