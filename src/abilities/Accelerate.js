const Ability = require('./Ability');
const Buff = require('../entities/Buff');

class Accelerate extends Ability {
	constructor() {
		super(200, 1, 0, 0, true, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!this.channelDuration) {
			this.buff = new Buff(0, this.uiColor, 'Speed');
			this.buff.moveSpeed = 3;
			player.addBuff(this.buff);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.expire();
	}
}

module.exports = Accelerate;
