const Ability = require('./Ability');
const {UiCs} = require('../UiConstants');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 3, 10, false, paintUiColumn, UiCs.DASH_COLOR);
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		if (!player.moveDirection[0] && !player.moveDirection[1])
			return false;
		player.safeMove(intersectionFinder, ...player.moveDirection, .1, true);
		return true;
	}
}

module.exports = Dash;
