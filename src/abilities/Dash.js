const Ability = require('./Ability');
const {Colors} = require('../util/Constants');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 3, 10, false, false, paintUiColumn, Colors.DASH);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;
		player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		return true;
	}
}

module.exports = Dash;
