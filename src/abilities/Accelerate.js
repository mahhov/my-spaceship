const Ability = require('./Ability');

class Accelerate extends Ability {
	constructor() {
		super(200, 1, 0, true, true);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		player.safeMove(intersectionFinder, ...player.currentMove, .01);
		return true;
	}
}

module.exports = Accelerate;
