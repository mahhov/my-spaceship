import ProjectileAttack from '../../abilities/ProjectileAttack.js';
import {clamp, minWhichA, rand, randInt} from '../../util/number.js';
import Vector from '../../util/Vector.js';

class EggBot {
	constructor(player, coopBotHeroes, hostileBotHeroes, egg, centerDir) {
		this.player = player;
		this.coopBotHeroes = coopBotHeroes;
		this.hostileBotHeroes = hostileBotHeroes;
		this.egg = egg;
		this.centerDir = centerDir;
	}

	get botHeroes() {
		return [...this.coopBotHeroes, ...this.hostileBotHeroes];
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.egg.update(map);
		let target = this.egg.ownerHero || this.egg;
		let friendlies = [this.player, ...this.coopBotHeroes].filter(botHero => !botHero.health.isEmpty());
		let hostiles = this.hostileBotHeroes.filter(botHero => !botHero.health.isEmpty());

		this.coopBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, friendlies, hostiles, target, this.centerDir);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});

		this.hostileBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, hostiles, friendlies, target, this.centerDir);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});
	}

	static heroGoals(hero, allies, hostiles, target, centerDir) {
		let movement = EggBot.heroMovement(hero, allies, hostiles, target, centerDir);
		let movementMagSqr = movement.magnitudeSqr;
		if (movementMagSqr)
			movement.magnitude = 1;

		let abilitiesDirect = hostiles.length ? EggBot.closestHostileDir(hero, hostiles) : new Vector(0, 0);

		// todo [low] tune
		// todo [low] getDistance has been removed
		let projectileAttackDistance = ProjectileAttack.getDistance(hero) + .1;
		// 0.94 0 Infinity
		let activeProjectileAttack = rand() < (projectileAttackDistance / abilitiesDirect.magnitude - .9) * 5;
		let activeAbilitiesWanted = [
			hostiles.length && activeProjectileAttack,
			movementMagSqr > .1 && movementMagSqr < 3 && rand() < .04, // dash
			hero.recentDamage.get() > .8, // increase defense
		];

		return {movement, activeAbilitiesWanted, abilitiesDirect};
	}

	static heroMovement(hero, allies, hostiles, target, centerDir) {
		// todo [low] tune
		let movement = new Vector(0, 0);
		let pos = Vector.fromObj(hero);

		let selfTarget = hero === target;
		let alliedTarget = false;
		let hostileTarget = false;

		let alliesMovement = allies.reduce((movement, ally) => {
			if (ally === hero)
				return movement;
			alliedTarget ||= ally === target;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(ally), .2, 4, 1, .5, 1, 0);
			return movement.add(delta);
		}, new Vector(0, 0));
		alliesMovement.multiply(1 / (allies.length + 1));

		let idealHostileDist = selfTarget ? .9 : .4;
		let hostilesMovement = hostiles.reduce((movement, hostile) => {
			hostileTarget ||= hostile === target;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(hostile), idealHostileDist, 1, 1);
			return movement.add(delta);
		}, new Vector(0, 0));
		hostilesMovement.multiply(1 / (hostiles.length + 1));

		let targetDist = !alliedTarget && !hostileTarget ? 0 : .3;
		let targetMovement = EggBot.movementFlock(hero, Vector.fromObj(target), targetDist, 1, 4, .01, 2, 1);

		if (rand() > .996 || !hero.avoidLineMovementDirection)
			hero.avoidLineMovementDirection = randInt(2) * 2 - 1;
		let avoidLineMovement = hostiles.reduce((movement, hostile) => {
			let delta = Vector.fromObj(hostile).subtract(pos);
			delta.rotateByCosSin(0, hero.avoidLineMovementDirection * movement.cross(delta) > 0 ? -1 : 1);
			delta.magnitude = clamp(1.25 * .4 - delta.magnitude * .4, 0, 1);
			return movement.add(delta);
		}, new Vector(0, 0));
		avoidLineMovement.multiply(10);

		// todo [low] conditional on having target
		let centerMovement = centerDir.copy.subtract(pos);
		centerMovement.magnitude = .1;

		movement
			.add(alliesMovement)
			.add(hostilesMovement)
			.add(targetMovement)
			.add(avoidLineMovement)
			.add(centerMovement);
		return movement;
	}

	static movementFlock(origin, target,
	                     idealDist, maxRepulse = 1, maxAttract = maxRepulse,
	                     fadeStartDist = idealDist * 2, fadeEndDist = fadeStartDist * 2, fadeAttract = Math.min(maxAttract, .05)) {
		// origin won't be modified. target will be modified.
		let delta = target.subtract(origin);
		let magnitude = delta.magnitude;
		if (!magnitude)
			return delta;
		let distanceToForce = [[0, -maxRepulse], [idealDist, 0], [fadeStartDist, maxAttract], [fadeEndDist, fadeAttract], [Infinity, fadeAttract]];
		let maxForceIndex = distanceToForce.findIndex(([distance]) => magnitude < distance);
		let blend = (magnitude - distanceToForce[maxForceIndex - 1][0]) / (distanceToForce[maxForceIndex][0] - distanceToForce[maxForceIndex - 1][0]);
		delta.magnitude = blend * distanceToForce[maxForceIndex][1] + (1 - blend) * distanceToForce[maxForceIndex - 1][1];
		return delta;
	}

	static closestHostileDir(hero, hostiles) {
		let pos = Vector.fromObj(hero);
		let deltas = hostiles.map(hostile => Vector.fromObj(hostile).subtract(pos));
		let i = minWhichA(deltas.map(delta => delta.magnitude));
		let dir = deltas[i];

		let projectedMovement = new Vector(...hostiles[i].currentMove);
		if (projectedMovement.magnitude) {
			projectedMovement.magnitude = .3 * dir.magnitude; //  .005 (hero v) / .014 (projectile v) = .3
			dir.add(projectedMovement);
		}

		let x = 1;
		if (!hero.lastAim)
			hero.lastAim = dir;
		else
			hero.lastAim.rotateByCosSinTowards(Math.cos(x / 180 * Math.PI), Math.sin(x / 180 * Math.PI), dir);
		hero.lastAim.magnitude = dir.magnitude;
		return hero.lastAim;
	}
}

export default EggBot;
