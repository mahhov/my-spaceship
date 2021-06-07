import Ability from './Ability.js';

class PassiveAbility extends Ability {
	constructor(disabledOk = false) {
		super('', 0, 1, 0, 0, true, 0);
		this.disabledOk = disabledOk;
	}
}

export default PassiveAbility;
