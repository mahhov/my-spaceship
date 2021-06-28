import Stat from '../playerData/Stat.js';
import Pool from '../util/Pool.js';
import Entity from './Entity.js';

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
		this.buffs = [];
	}

	applyInitialBuffs() {
		// should be invoked once after buffs are set
		this.health.max *= this.getStat(Stat.Ids.LIFE);
		this.health.restore();
	}

	refresh() {
		this.tickBuffs();
	}

	changeHealth(amount) {
		this.health.change(amount / this.getStat(Stat.Ids.ARMOR));
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

	tickBuffs() {
		this.buffs = this.buffs.filter(buff => !buff.tick());
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

export default LivingEntity;
