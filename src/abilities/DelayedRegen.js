import BaseStats from '../playerData/BaseStats.js';
import TechniqueData from '../playerData/TechniqueData.js';
import Pool from '../util/Pool.js';
import PassiveAbility from './PassiveAbility.js';

const statIds = TechniqueData.StatIds.TechniqueBase;

const baseStats = new BaseStats({
	[statIds.COOLDOWN_DURATION]: [0, 0],
	[statIds.COOLDOWN_RATE]: [0, 0],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [0, 0],
	[statIds.CHANNEL_STAMINA_COST]: [0, 0],
	[statIds.CHANNEL_DURATION]: [0, 0],
	[statIds.REPEATABLE]: [1, 1],
});

class DelayedRegen extends PassiveAbility {
	constructor(statManager) {
		statManager.mergeBaseStats(baseStats);
		super(statManager);
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || hero.health.isFull())
			return false;
		hero.changeHealth(this.statManager.getBasedStat(statIds.LIFE_REGEN));
		hero.changeShield(this.statManager.getBasedStat(statIds.SHIELD_REGEN));
		return true;
	}
}

export default DelayedRegen;
