const Ability = require('./Ability');
const Pool = require('../util/Pool');

class DelayedRegen extends Ability {
	constructor() {
		super(0, 1, 0, 0, true, 0);
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || hero.health.isFull())
			return false;
		hero.changeHealth(.0003);
		return true;
	}
}

module.exports = DelayedRegen;
