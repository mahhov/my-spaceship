import TechniqueData from '../playerData/TechniqueData.js';
import {booleanArray} from '../util/number.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.Dash;

const BaseStats = {
	[statIds.COOLDOWN_DURATION]: [120, 1],
	[statIds.COOLDOWN_RATE]: [1, 1],
	[statIds.MAX_CHARGES]: [3, 1],
	[statIds.STAMINA_COST]: [15, 1],
	[statIds.CHANNEL_STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_DURATION]: [0, 1],
	[statIds.REPEATABLE]: [0, 1],
};

class Dash extends Ability {
	constructor(statManager) {
		statManager.mergeBaseStats(BaseStats);
		super('Dash', statManager);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!booleanArray(hero.currentMove))
			return false;
		hero.safeMove(intersectionFinder, ...hero.currentMove, .1, true);
		return true;
	}
}

export default Dash;
