import Ability from './Ability.js';
import {Colors} from '../util/Constants.js';
import Bomb from '../entities/attack/Bomb.js';

class BombAttack extends Ability {
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
