const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');

class Accelerate extends Ability {
	constructor(paintUiColumn) {
		super(2, 100, 0, true, paintUiColumn, UiCs.DASH); // todo [high] use unique color
	}

	activate(origin, direct, map, intersectionFinder, player) {
		// todo [medium] support more complicated activate logic, such as charge, duration until key release, cooldown begin on release,
		player.safeMove(intersectionFinder, ...player.currentMove, .01);
		return true;
	}
}

module.exports = Accelerate;
