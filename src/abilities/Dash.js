const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');
const Buff = require('../entities/Buff');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!booleanArray(player.currentMove))
			return false;

		if (!this.channelDuration) {
			this.buff = new Buff(this.uiColor, 'Speed');
			this.buff.moveSpeed = 1;
			player.addBuff(this.buff);
			player.safeMove(intersectionFinder, ...player.currentMove, .1, true);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.expire();
	}

}

module.exports = Dash;
