const Ability = require('./Ability');
const {Colors} = require('../util/Constants');

class Accelerate extends Ability {
	constructor(paintUiColumn) {
		super(200, 1, 0, true, true, paintUiColumn, Colors.ACCELERATE);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		player.safeMove(intersectionFinder, ...player.currentMove, .01);
		return true;
	}
}

module.exports = Accelerate;
