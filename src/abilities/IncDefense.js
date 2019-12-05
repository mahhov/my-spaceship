const Ability = require('./Ability');
const Buff = require('../entities/Buff');

class IncDefense extends Ability {
	constructor() {
		super(200, 1, 0, false, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.armor = 3;
		player.addBuff(this.buff);
		return true;
	}
}

module.exports = IncDefense;
