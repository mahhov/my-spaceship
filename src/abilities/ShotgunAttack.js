import Projectile from '../entities/attack/Projectile.js';
import Buff from '../entities/Buff.js';
import {randVector, setMagnitude} from '../util/Number.js';
import Ability from './Ability.js';

class ShotgunAttack extends Ability {
	constructor() {
		super('Shotgun', 50, 1, 12, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = ShotgunAttack.velocity, SPREAD = .15, SIZE = .02, DAMAGE = .1, REPEAT = 5;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		for (let i = 0; i < REPEAT; i++) {
			let randv = randVector(VELOCITY * SPREAD);
			let projectile = new Projectile(
				origin.x, origin.y,
				SIZE, SIZE,
				directv.x + randv[0], directv.y + randv[1],
				ShotgunAttack.getTime(hero), DAMAGE,
				hero.friendly);
			map.addProjectile(projectile);
		}
		return true;
	}

	static getTime(hero) {
		return 60 * Buff.attackRange(hero.buffs);
	}

	static get velocity() {
		return .014;
	}
}

export default ShotgunAttack;
