import Ability from './Ability.js';
import {setMagnitude} from '../util/Number.js';

class Heal extends Ability {
	constructor() {
		super(720, 1, 30, 0, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isFull())
			return false;
		hero.changeHealth(.1);
		return true;
	}
}

export default Heal;
