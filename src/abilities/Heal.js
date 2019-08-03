const Ability = require('./Ability');
const {setMagnitude} = require('../util/Number');

class Heal extends Ability {
	constructor() {
		super(720, 1, 30, false, false);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.health.isFull())
			return false;
		player.changeHealth(.1);
		return true;
	}
}

module.exports = Heal;
