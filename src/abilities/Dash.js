const Ability = require('./Ability');
const Color = require('../util/Color');
const {setMagnitude} = require('../util/Number');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 0, 3, false, paintUiColumn, Color.fromHex(0x4, 0xa, 0x4, true));
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		[directX, directY] = setMagnitude(directX, directY, 1);
		player.safeMove(intersectionFinder, directX, directY, .1, true);
	}
}

module.exports = Dash;
