const Ability = require('./Ability');

class Dash extends Ability {
	constructor(paintUiColumn) {
		super(6, 0, 3, paintUiColumn, '#4a4');
	}

	activate(originX, originY, directX, directY, logic) {
		// todo add dash functionlaity
	}
}

module.exports = Dash;
