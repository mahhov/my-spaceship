import Projectile from '../entities/attack/Projectile.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.ProjectileAttack;

class ProjectileAttack extends Ability {
	constructor(statManager) {
		super('Projectile', statManager, 6, 15 * statManager.getStat(statIds.ABILITY_CHARGES), .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const SPREAD = .08, DAMAGE = .1;
		let size = .02 * this.statManager.getStat(statIds.ABILITY_SIZE);
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
		return 60 * hero.statManager.getStat(Stat.Ids.ATTACK_RANGE);
	}

	static get velocity() {
		return .014;
	}
}

export default ProjectileAttack;
