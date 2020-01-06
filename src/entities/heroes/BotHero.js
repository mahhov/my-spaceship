const Hero = require('./Hero');
const Buff = require('../Buff');

class BotHero extends Hero {
	update(map, intersectionFinder, monsterKnowledge, goals) {
		this.refresh();
		this.updateMove(intersectionFinder, goals.movement.x, goals.movement.y, .005 * Buff.moveSpeed(this.buffs));
		// todo [medium] speed should be parameterizable in Hero constructor.
		this.updateAbilities(map, intersectionFinder, goals.activeAbilitiesWanted, goals.abilitiesDirect);
		this.createMovementParticle(map);
	}
}

module.exports = BotHero;
