const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;

		if (!this.channelDuration)   {
			this.buff = this.buff || player.addBuff();
			this.buff.moveSpeed = 1;
			player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.moveSpeed = 0;
	}

}

module.exports = Dash;
