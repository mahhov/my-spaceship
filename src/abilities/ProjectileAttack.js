import Projectile from '../entities/attack/Projectile.js';
import Stat from '../playerData/Stat.js';
import makeEnum from '../util/enum.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

const StatIds = makeEnum({
	...Stat.Ids,
	ABILITY_CHARGES: 0,
	ABILITY_SIZE: 0,
});

class ProjectileAttack extends Ability {
	constructor(statValues) {
		super('Projectile', 6, 15 * (1 + statValues.get(StatIds.ABILITY_CHARGES)), .6, 0, true, 0);
		// todo [high] move these assignments to Ability constructor
		this.statValues = statValues;
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const SPREAD = .08, DAMAGE = .1;
		let size = .02 * (1 + this.statValues.get(StatIds.ABILITY_SIZE));
		let directv = setMagnitude(direct.x, direct.y, ProjectileAttack.velocity);
		let randv = randVector(ProjectileAttack.velocity * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y,
			size, size,
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

ProjectileAttack.StatIds = StatIds;

export default ProjectileAttack;
