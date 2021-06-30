import TechniqueData from '../playerData/TechniqueData.js';
import Pool from '../util/Pool.js';
import PassiveAbility from './PassiveAbility.js';

const statIds = TechniqueData.StatIds.TechniqueBase;

const BaseStats = {
	[statIds.COOLDOWN_RATE]: [1, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_DURATION]: [0, 1],
	[statIds.REPEATABLE]: [1, 1],
};

class DelayedRegen extends PassiveAbility {
	constructor(statManager, regenAmount) {
		statManager.mergeBaseStats(BaseStats);
		super(statManager);
		this.regenAmount = regenAmount;
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || hero.health.isFull())
			return false;
		hero.changeHealth(this.regenAmount);
		return true;
	}
}

export default DelayedRegen;
