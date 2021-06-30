import Ability from './Ability.js';

class PassiveAbility extends Ability {
	constructor(statManager, disabledOk = false) {
		super('', statManager);
		this.disabledOk = disabledOk;
	}
}

export default PassiveAbility;
