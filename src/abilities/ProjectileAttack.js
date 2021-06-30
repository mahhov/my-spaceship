import Projectile from '../entities/attack/Projectile.js';
import Buff from '../entities/Buff.js';
import EntityObserver from '../entities/EntityObserver.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.ProjectileAttack;

const BaseStats = {
	[statIds.DAMAGE]: [.1, 1],

	[statIds.COOLDOWN_RATE]: [1 / 6, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [.6, 1],
	[statIds.CHANNEL_STAMINA_COST]: [1, 0],
	[statIds.CHANNEL_DURATION]: [1, 0],
	[statIds.REPEATABLE]: [1, 1],

	[statIds.ABILITY_CHANNEL]: [1, 0],
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
		if (!this.statManager.getBasedStat(statIds.CHANNEL_DURATION))
			this.fireProjectile(origin, direct, map, hero);

		else if (!this.channelDuration) {
			this.chargeBuff = new Buff(0, this.uiColor, 'Slow');
			this.chargeBuff.addStatValue(Stat.Ids.MOVE_SPEED, -.5);
			hero.statManager.addBuff(this.chargeBuff);
		}

		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		if (this.statManager.getBasedStat(statIds.CHANNEL_DURATION)) {
			this.fireProjectile(origin, direct, map, hero, 1 + this.channelRatio * 3);
			this.chargeBuff.expire();
		}
	}

	fireProjectile(origin, direct, map, hero, channelDamageMultiplier = 1) {
		const SPREAD = .08;
		let damage = channelDamageMultiplier * this.statManager.getBasedStat(Stat.Ids.DAMAGE);
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
