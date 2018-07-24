const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 3, 10, false, paintUiColumn, UiCs.DASH_COLOR);
	}

	activate(origin, direct, logic, intersectionFinder, player) {
		if (!booleanArray(player.moveDirection))
			return false;
		player.safeMove(intersectionFinder, ...player.moveDirection, .1, true);
		return true;
	}
}

module.exports = Dash;
