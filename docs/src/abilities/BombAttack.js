import Bomb from '../entities/attack/Bomb.js';
import {Colors} from '../util/constants.js';
import Ability from './Ability.js';

class BombAttack extends Ability {
	// todo [low] this constructor is outdated
	constructor(paintUiColumn) {
		super(200, 2, 20, false, false, paintUiColumn, Colors.BASIC_ATTACK);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const SIZE = .05, RANGE = .15, TIME = 100, DAMAGE = .01, MAX_TARGETS = 5;
		let bomb = new Bomb(origin.x, origin.y, SIZE, SIZE, RANGE, TIME, DAMAGE, MAX_TARGETS, true);
		map.addProjectile(bomb);
		return true;
	}
}

export default BombAttack;
