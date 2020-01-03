const Hero = require('../Hero');
const Buff = require('../Buff');

class BotHero extends Hero {
	update(map, intersectionFinder, monsterKnowledge, goals) {
		this.refresh();
		this.moveControl(intersectionFinder, goals);
		this.abilityControl(map, intersectionFinder, goals);
	}

	moveControl(intersectionFinder, goals) {
		this.safeMove(intersectionFinder, goals.movement.x, goals.movement.y, .005 * Buff.moveSpeed(this.buffs));
		// todo [med] speed should be parameterizable in Hero constructor.
	}

	abilityControl(map, intersectionFinder, goals) {
		this.updateAbilities(map, intersectionFinder, goals.activeAbilitiesWanted, goals.abilitiesDirect);
	}
}

module.exports = BotHero;
