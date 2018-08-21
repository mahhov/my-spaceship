const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');

class Accelerate extends Ability {
	constructor(paintUiColumn) {
		super(200, 1, 0, true, true, paintUiColumn, UiCs.DASH); // todo [high] use unique color
	}

	activate(origin, direct, map, intersectionFinder, player) {
		player.safeMove(intersectionFinder, ...player.currentMove, .01);
		return true;
	}
}

module.exports = Accelerate;
