const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor() {
		super(120, 3, 10, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;
		player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		return true;
	}
}

module.exports = Dash;
