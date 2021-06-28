import Pool from '../util/Pool.js';
import PassiveAbility from './PassiveAbility.js';

class DelayedRegen extends PassiveAbility {
	constructor(regenAmount) {
		super();
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
