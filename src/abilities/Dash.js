const Ability = require('./Ability');
const UiCs = require('../UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 3, 30, false, paintUiColumn, UiCs.DASH_COLOR);
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		[directX, directY] = setMagnitude(directX, directY, 1);
		player.safeMove(intersectionFinder, directX, directY, .1, true);
	}
}

module.exports = Dash;
