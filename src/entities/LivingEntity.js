import Entity from './Entity.js';
import Pool from '../util/Pool.js';
import Buff from './Buff.js';

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
		this.health.change(amount / Buff.armor(this.buffs));
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
