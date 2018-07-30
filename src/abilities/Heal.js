const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(720, 1, 30, false, paintUiColumn, UiCs.HEAL_COLOR);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (player.health.isFull())
			return false;
		player.changeHealth(.1);
		return true;
	}
}

module.exports = Dash;
