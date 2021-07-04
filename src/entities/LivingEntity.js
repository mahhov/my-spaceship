import Stat from '../playerData/Stat.js';
import {clamp} from '../util/number.js';
import Pool from '../util/Pool.js';
import Entity from './Entity.js';
import EntityObserver from './EntityObserver.js';
import StatManager from './StatManager.js';

class LivingEntity extends Entity {
	constructor(x, y, width, height, baseStats, statValues, layer) {
		super(x, y, width, height, layer);
		this.statManager = new StatManager(baseStats, [statValues]);
		this.health = new Pool(this.statManager.getBasedStat(Stat.Ids.LIFE));
		this.shield = new Pool(this.statManager.getBasedStat(Stat.Ids.SHIELD));
	}

	refresh() {
		let takingDamageOverTime = this.statManager.getBasedStat(Stat.Ids.TAKING_DAMAGE_OVER_TIME);
		this.takeDamage(takingDamageOverTime);
		this.statManager.tickBuffs();
		this.processQueuedEvents();
	}

	processQueuedEvents() {
		let lifeLeechAmount = this.getQueuedEvents(EntityObserver.EventIds.DEALT_DAMAGE)
			.reduce((sum, [source, damage]) => sum + damage * source.statManager.getBasedStat(Stat.Ids.LIFE_LEECH), 0);
		this.changeHealth(lifeLeechAmount);
		this.clearAllQueuedEvents();
	}

	changeHealth(amount) {
		this.health.change(amount);
	}

	takeDamage(amount) {
		amount /= this.statManager.getBasedStat(Stat.Ids.ARMOR);
		let damageDealt = clamp(amount, 0, this.health.value);
		this.changeHealth(-amount);
		return damageDealt;
	}

	isDead() {
		return this.health.isEmpty();
	}

	addBuff(buff) {
		this.statManager.addBuff(buff);
	}

	restoreHealth() {
		this.health.restore();
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

export default LivingEntity;
