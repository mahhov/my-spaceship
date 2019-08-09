const Ability = require('./Ability');
const {Colors} = require('../util/Constants');

class DelayedRegen extends Ability {
	constructor() {
		super(0, 1, 0, 0, true, false);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.health.isFull())
			return false;
		player.changeHealth(.0005);
		return true;
	}
}

module.exports = DelayedRegen;
