const Ability = require('./Ability');
const {setMagnitude} = require('../util/Number');

class Heal extends Ability {
	constructor() {
		super(720, 1, 30, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isFull())
			return false;
		hero.changeHealth(.1);
		return true;
	}
}

module.exports = Heal;
