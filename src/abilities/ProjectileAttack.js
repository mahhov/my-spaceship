import Projectile from '../entities/attack/Projectile.js';
import Stat from '../playerData/Stat.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

class ProjectileAttack extends Ability {
	constructor() {
		super('Projectile', 6, 15, .6, 0, true, 0);
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
		return 60 * hero.getStat(Stat.Ids.ATTACK_RANGE);
	}

	static get velocity() {
		return .014;
	}
}

export default ProjectileAttack;
