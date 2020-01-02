const Ability = require('./Ability');
const Buff = require('../entities/Buff');

class IncDefense extends Ability {
	constructor() {
		super(600, 1, 0, false, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.armor = 3;
		hero.addBuff(this.buff);
		return true;
	}
}

module.exports = IncDefense;
