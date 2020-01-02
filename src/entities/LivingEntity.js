const Entity = require('./Entity');
const Pool = require('../util/Pool');
const Buff = require('./Buff');

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

module.exports = LivingEntity;
