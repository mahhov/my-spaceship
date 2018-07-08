const Ability = require('./Ability');
const Color = require('../util/Color');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(120, 0, 3, paintUiColumn, Color.fromHex(0x4, 0xa, 0x4, true));
		// todo prevent repeat with key down
	}

	activate(originX, originY, directX, directY, logic) {
		// todo add dash functionlaity
	}
}

module.exports = Dash;
