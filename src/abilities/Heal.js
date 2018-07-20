const Ability = require('./Ability');
const {UiCs} = require('../UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(720, 1, 30, false, paintUiColumn, UiCs.HEAL_COLOR);
	}

	activate(origin, direct, logic, intersectionFinder, player) {
		if (player.isFullHealth())
			return false;
		player.changeHealth(.1);
		return true;
	}
}

module.exports = Dash;
