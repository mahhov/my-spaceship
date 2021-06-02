import Buff from '../Buff.js';
import Hero from './Hero.js';

class BotHero extends Hero {
	update(map, intersectionFinder, monsterKnowledge, goals) {
		this.refresh();
		this.updateMove(intersectionFinder, goals.movement.x, goals.movement.y, .005 * Buff.moveSpeed(this.buffs));
		// todo [medium] speed should be parameterizable in Hero constructor.
		this.updateAbilities(map, intersectionFinder, goals.activeAbilitiesWanted, goals.abilitiesDirect);
		this.createMovementParticle(map);
	}
}

export default BotHero;
