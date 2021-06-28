import Laser from '../entities/attack/Laser.js';
import {setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

class LaserAttack extends Ability {
	constructor(statValues) {
		super('Laser', statValues, 20, 1, 3, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const SPREAD = .08, SIZE = .002, TIME = 50, DAMAGE = .01;
		let directv = setMagnitude(direct.x, direct.y, LaserAttack.getDistance(hero));
		let laser = new Laser(
			origin.x, origin.y,
			directv.x, directv.y,
			SIZE,
			TIME, DAMAGE, hero.friendly);
		map.addProjectile(laser);
		return true;
	}

	static getDistance(hero) {
		return .3;
	}
}

export default LaserAttack;
