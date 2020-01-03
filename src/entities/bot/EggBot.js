const Vector = require('../../util/Vector');
const {minWhichA, clamp, rand} = require('../../util/Number');

class EggBot {
	constructor(player, coopBotHeroes, hostileBotHeroes) {
		this.player = player;
		this.coopBotHeroes = coopBotHeroes;
		this.hostileBotHeroes = hostileBotHeroes;
	}

	get botHeroes() {
		return [...this.coopBotHeroes, ...this.hostileBotHeroes];
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.coopBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, [this.player, ...this.coopBotHeroes], this.hostileBotHeroes, this.player);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});

		this.hostileBotHeroes.forEach(botHero => {
			let goals = EggBot.heroGoals(botHero, this.hostileBotHeroes, [this.player, ...this.coopBotHeroes], this.player);
			botHero.update(map, intersectionFinder, monsterKnowledge, goals);
		});
	}

	static heroGoals(hero, allies, hostiles, target) {
		let movement = EggBot.heroMovement(hero, allies, hostiles, target);
		let movementMagSqr = movement.magnitudeSqr;
		movement.magnitude = 1;

		let abilitiesDirect = EggBot.closestHostileDir(hero, hostiles);
		abilitiesDirect.add(Vector.fromRand(abilitiesDirect.magnitude / 5));

		let activeAbilitiesWanted = [
			rand() < 1.75 - abilitiesDirect.magnitude * 2.5,
			movementMagSqr > 1 && movementMagSqr < 3 || rand() > .99];

		return {movement, activeAbilitiesWanted, abilitiesDirect};
	}

	static heroMovement(hero, allies, hostiles, target) {
		let movement = new Vector(0, 0);
		let pos = Vector.fromObj(hero);

		let alliedTarget = false;
		let alliesMovement = allies.reduce((movement, ally) => {
			if (ally === hero)
				return movement;
			alliedTarget = alliedTarget || ally === target;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(ally), .2, 1, 0, 1000, 1000000, 0); // todo [high] tune params
			return movement.add(delta);
		}, new Vector(0, 0));

		let hostilesMovement = hostiles.reduce((movement, hostile) => {
			if (hostile === target)
				return movement;
			let delta = EggBot.movementFlock(pos, Vector.fromObj(hostile), alliedTarget ? .1 : .35, 1, 1);
			return movement.add(delta);
		}, new Vector(0, 0));

		let targetMovement = EggBot.movementFlock(hero, Vector.fromObj(target), 0, 0, alliedTarget ? 2 : 10, 10);

		movement
			.add(alliesMovement)
			.add(hostilesMovement)
			.add(targetMovement);

		let avoidLineMovement = hostiles.reduce((movement, hostile) => {
			let delta = Vector.fromObj(hostile).subtract(pos);
			delta.rotateByCosSin(0, movement.cross(delta) > 0 ? -1 : 1);
			delta.magnitude = clamp(1.25 - delta.magnitude * 2.5, 0, 1);
			return movement.add(delta);
		}, new Vector(0, 0));

		movement.add(avoidLineMovement);
		return movement;

		// * towards allies
		// * towards enemies if has more health
		// * away from enemies if has less health
		// away enemies if has egg
		// * towards from enemies if enemy has egg
		// towards egg if egg on ground
		// towards center if have egg
	}

	static movementFlock(origin, target,
	                     idealDist, maxRepulse = 1, maxAttract = maxRepulse,
	                     fadeStartDist = idealDist * 2, fadeEndDist = fadeStartDist * 2, fadeAttract = Math.min(maxAttract, .05)) {
		// origin won't be modified. target will be modified.
		let delta = target.subtract(origin);
		let magnitude = delta.magnitude;
		if (magnitude < idealDist)
			delta.magnitude = -maxRepulse * (1 - magnitude / idealDist);
		else if (magnitude < fadeStartDist)
			delta.magnitude = maxAttract * (magnitude - idealDist) / (fadeStartDist - idealDist);
		else if (magnitude < fadeEndDist)
			delta.magnitude = -maxAttract * (magnitude - fadeStartDist) / (fadeEndDist - fadeStartDist) + maxAttract;
		else
			delta.magnitude = fadeAttract;
		return delta;
	}

	static closestHostileDir(hero, hostiles) {
		let pos = Vector.fromObj(hero);
		let deltas = hostiles.map(hostile => Vector.fromObj(hostile).subtract(pos));
		let i = minWhichA(deltas.map(delta => delta.magnitude));
		return deltas[i];
	}
}

module.exports = EggBot;
