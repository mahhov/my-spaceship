import {booleanArray} from '../util/number.js';
import Ability from './Ability.js';

class Dash extends Ability {
	constructor(statManager) {
		super('Dash', statManager, 120, 3, 15, .1, false, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!booleanArray(hero.currentMove))
			return false;
		hero.safeMove(intersectionFinder, ...hero.currentMove, .1, true);
		return true;
	}
}

export default Dash;
