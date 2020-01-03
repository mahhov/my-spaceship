const Ability = require('./Ability');

class PassiveAbility extends Ability {
	constructor() {
		super(0, 1, 0, 0, true, 0);
	}
}

module.exports = PassiveAbility;
