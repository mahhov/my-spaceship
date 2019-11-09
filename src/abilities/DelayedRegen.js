const Ability = require('./Ability');
const Pool = require('../util/Pool');

class DelayedRegen extends Ability {
	constructor() {
		super(0, 1, 0, 0, true, 0);
		this.delay = new Pool(60, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.recentDamage.get())
			this.delay.restore();
		if (!this.delay.increment() || player.health.isFull())
			return false;
		player.changeHealth(.0003);
		return true;
	}
}

module.exports = DelayedRegen;
