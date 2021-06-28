import Ability from './Ability.js';

class Heal extends Ability {
	constructor(statValues) {
		super('Heal', statValues, 720, 1, 30, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isFull())
			return false;
		hero.changeHealth(.1);
		return true;
	}
}

export default Heal;
