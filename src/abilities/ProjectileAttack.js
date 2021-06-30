import Projectile from '../entities/attack/Projectile.js';
import EntityObserver from '../entities/EntityObserver.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.ProjectileAttack;

const BaseStats = {
	[Stat.Ids.DAMAGE]: [.1, 1],

	[statIds.ABILITY_CHARGES]: [10, 1],
	[statIds.ABILITY_SIZE]: [.02, 1],
};

class ProjectileAttack extends Ability {
	constructor(statManager) {
		super('Projectile', statManager, 6, statManager.getBasedStat(statIds.ABILITY_CHARGES), .6, 0, true, 0);
	}

	observe(hero) {
		let damageDealt = this.getQueuedEvents(EntityObserver.EventIds.DEALT_DAMAGE)
			.reduce((sum, [amount]) => sum + amount, 0);
		let leechAmount = damageDealt * this.statManager.getBasedStat(statIds.LIFE_LEECH);
		hero.changeHealth(leechAmount);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const SPREAD = .08;
		let damage = this.statManager.getBasedStat(Stat.Ids.DAMAGE);
		let size = this.statManager.getBasedStat(statIds.ABILITY_SIZE);
		let directv = setMagnitude(direct.x, direct.y, ProjectileAttack.velocity);
		let randv = randVector(ProjectileAttack.velocity * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y,
			size, size,
			directv.x + randv[0], directv.y + randv[1],
			ProjectileAttack.getTime(hero), damage,
			hero.friendly, this);
		map.addProjectile(projectile);
		return true;
	}

	static getDistance(hero) {
		return ProjectileAttack.getTime(hero) * ProjectileAttack.velocity;
	}

	static getTime(hero) {
		return 60 * (hero.statManager.getStat(Stat.Ids.ATTACK_RANGE) + 1);
	}

	static get velocity() {
		return .014;
	}
}

ProjectileAttack.BaseStats = BaseStats;

export default ProjectileAttack;
