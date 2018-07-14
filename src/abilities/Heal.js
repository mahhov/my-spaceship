const Ability = require('./Ability');
const {UiCs} = require('../UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(720, 1, 30, false, paintUiColumn, UiCs.HEAL_COLOR);
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		player.changeHealth(.1);
	}
}

module.exports = Dash;
