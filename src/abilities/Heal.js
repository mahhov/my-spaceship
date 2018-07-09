const Ability = require('./Ability');
const Color = require('../util/Color');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 0, 3, false, paintUiColumn, Color.fromHex(0x4, 0x4, 0xa, true));
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		player.changeHealth(.1);
	}
}

module.exports = Dash;
