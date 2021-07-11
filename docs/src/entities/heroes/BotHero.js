import Stat from '../../playerData/Stat.js';
import Hero from './Hero.js';

class BotHero extends Hero {
	update(map, intersectionFinder, monsterKnowledge, goals) {
		this.refresh();
		this.updateMove(intersectionFinder, goals.movement.x, goals.movement.y, .005 * (1 + this.statManager.getStat(Stat.Ids.MOVE_SPEED)));
		// todo [medium] speed should be parameterizable in Hero constructor.
		this.updateAbilities(map, intersectionFinder, goals.activeAbilitiesWanted, goals.abilitiesDirect);
		this.createMovementParticle(map);
	}
}

export default BotHero;
