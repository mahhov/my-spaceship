import Projectile from '../entities/attack/Projectile.js';
import EntityObserver from '../entities/EntityObserver.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.ProjectileAttack;

const BaseStats = {
	[statIds.DAMAGE]: [.1, 1],

	[statIds.COOLDOWN_RATE]: [1 / 6, 1],
	[statIds.MAX_CHARGES]: [10, 1],
	[statIds.STAMINA_COST]: [.6, 1],
	[statIds.CHANNEL_STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_DURATION]: [0, 1],
	[statIds.REPEATABLE]: [1, 1],

	[statIds.ABILITY_SIZE]: [.02, 1],
};

class ProjectileAttack extends Ability {
	constructor(statManager) {
		statManager.mergeBaseStats(BaseStats);
		super('Projectile', statManager);
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

export default ProjectileAttack;
