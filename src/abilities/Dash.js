const Ability = require('./Ability');
const {booleanArray} = require('../util/Number');
const Buff = require('../entities/Buff');

class Dash extends Ability {
	constructor() {
		super(120, 3, 15, .1, false, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!booleanArray(hero.currentMove))
			return false;

		if (!this.channelDuration) {
			this.buff = new Buff(0, this.uiColor, 'Speed');
			this.buff.moveSpeed = 1;
			hero.addBuff(this.buff);
			hero.safeMove(intersectionFinder, ...hero.currentMove, .1, true);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		this.buff.expire();
	}

}

module.exports = Dash;
