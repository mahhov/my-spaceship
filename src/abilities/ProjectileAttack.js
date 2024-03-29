import Projectile from '../entities/attack/Projectile.js';
import Buff from '../entities/Buff.js';
import EntityObserver from '../entities/EntityObserver.js';
import BaseStats from '../playerData/BaseStats.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {Colors} from '../util/constants.js';
import {rand} from '../util/number.js';
import Vector from '../util/Vector.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.ProjectileAttack;

const baseStats = new BaseStats({
	[statIds.DAMAGE]: [10, 1],
	[statIds.ATTACK_RANGE]: [60, 1],
	[statIds.CRITICAL_CHANCE]: [.2, 1],
	[statIds.CRITICAL_DAMAGE]: [1, 2],

	[statIds.COOLDOWN_DURATION]: [6, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [.6, 1],
	[statIds.CHANNEL_STAMINA_COST]: [1, 0],
	[statIds.CHANNEL_DURATION]: [1, 0],
	[statIds.REPEATABLE]: [1, 1],

	[statIds.ABILITY_MULTISHOT]: [1, 1],
	[statIds.ABILITY_SIZE]: [.02, 1],
	[statIds.ABILITY_SPREAD]: [.08, 1],
});

class ProjectileAttack extends Ability {
	constructor(statManager) {
		statManager.mergeBaseStats(baseStats);
		super(statManager);
	}

	processQueuedEvents(hero) {
		this.getQueuedEvents(EntityObserver.EventIds.DEALT_DAMAGE)
			.forEach(([damage]) => hero.queueEvent(EntityObserver.EventIds.DEALT_DAMAGE, this, damage));
		this.bubbleTo(EntityObserver.EventIds.KILLED, hero);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!this.statManager.getBasedStat(statIds.CHANNEL_DURATION)) {
			this.fireProjectile(origin, direct, map, hero);

		} else if (!this.channelDuration) {
			this.chargeBuff = new Buff(0, this.uiColor, 'Slow');
			this.chargeBuff.addStatValue(statIds.MOVE_SPEED, -.5);
			hero.addBuff(this.chargeBuff);
		}

		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		if (this.statManager.getBasedStat(statIds.CHANNEL_DURATION)) {
			this.fireProjectile(origin, direct, map, hero, 1 + this.channelRatio * 19);
			this.chargeBuff.expire();
		}
	}

	fireProjectile(origin, direct, map, hero, channelDamageMultiplier = 1) {
		const MULTISHOT_THETA = 10 / 180 * Math.PI;
		const VELOCITY = .014;

		let damage = channelDamageMultiplier * this.statManager.getBasedStat(statIds.DAMAGE);
		if (rand() < this.statManager.getBasedStat(statIds.CRITICAL_CHANCE))
			damage *= this.statManager.getBasedStat(statIds.CRITICAL_DAMAGE);
		let multishot = this.statManager.getBasedStat(statIds.ABILITY_MULTISHOT);
		let spread = this.statManager.getBasedStat(statIds.ABILITY_SPREAD);
		let size = this.statManager.getBasedStat(statIds.ABILITY_SIZE);
		let time = this.statManager.getBasedStat(statIds.ATTACK_RANGE);
		let directVector = Vector.fromObj(direct).setMagnitude(VELOCITY).rotateByTheta(-(multishot + 1) / 2 * MULTISHOT_THETA);

		let damageOverTimeDuration = 100, damageOverTime = damage * this.statManager.getBasedStat(statIds.DAMAGE_OVER_TIME);
		let damageOverTimeBuff = new Buff(damageOverTimeDuration, Colors.PLAYER_BUFFS.DAMAGE_OVER_TIME, 'DOT');
		damageOverTimeBuff.addStatValue(statIds.TAKING_DAMAGE_OVER_TIME, damageOverTime / damageOverTimeDuration);

		for (let i = 0; i < multishot; i++) {
			directVector.rotateByTheta(MULTISHOT_THETA);
			let vector = Vector
				.fromRand(VELOCITY * spread)
				.add(directVector);
			let projectile = new Projectile(
				origin.x, origin.y,
				size, size,
				vector.x, vector.y,
				time, damage,
				hero.friendly, this);
			projectile.addBuff(damageOverTimeBuff.clone);
			map.addProjectile(projectile);
		}
	}
}

export default ProjectileAttack;
