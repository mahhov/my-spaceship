const Ability = require('./Ability');

class PassiveAbility extends Ability {
	constructor(disabledOk = false) {
		super(0, 1, 0, 0, true, 0);
		this.disabledOk = true;
	}
}

module.exports = PassiveAbility;
