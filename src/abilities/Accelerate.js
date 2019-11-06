const Ability = require('./Ability');

class Accelerate extends Ability {
	constructor() {
		super(200, 1, 0, 0, true, -1);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (!this.channelDuration) {
			this.buff = this.buff || player.addBuff();
			this.buff.moveSpeed = 3;j
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		this.buff.moveSpeed = 0;
	}
}

module.exports = Accelerate;
