import Ability from './Ability.js';
import {setMagnitude, randVector} from '../util/Number.js';
import Projectile from '../entities/attack/Projectile.js';
import Buff from '../entities/Buff.js';

class ProjectileAttack extends Ability {
	constructor() {
		super(6, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const SPREAD = .08, SIZE = .02, DAMAGE = .1;
		let directv = setMagnitude(direct.x, direct.y, ProjectileAttack.velocity);
		let randv = randVector(ProjectileAttack.velocity * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y,
			SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			ProjectileAttack.getTime(hero), DAMAGE,
			hero.friendly);
		map.addProjectile(projectile);
		return true;
	}

	static getDistance(hero) {
		return ProjectileAttack.getTime(hero) * ProjectileAttack.velocity;
	}

	static getTime(hero) {
		return 60 * Buff.attackRange(hero.buffs);
	}

	static get velocity() {
		return .014;
	}
}

export default ProjectileAttack;
