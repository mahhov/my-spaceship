const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!booleanArray(hero.currentMove))
			return false;
		hero.safeMove(intersectionFinder, ...hero.currentMove, .1, true);
		return true;
	}
}

module.exports = Dash;
