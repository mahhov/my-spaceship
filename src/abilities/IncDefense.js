import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.Defense;

const BaseStats = {
	[statIds.COOLDOWN_DURATION]: [600, 1],
	[statIds.COOLDOWN_RATE]: [1, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_DURATION]: [0, 1],
	[statIds.REPEATABLE]: [0, 1],
};

class IncDefense extends Ability {
	constructor(statManager) {
		statManager.mergeBaseStats(BaseStats);
		super('Armor', statManager);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.addStatValue(Stat.Ids.ARMOR, 3);
		hero.statManager.addBuff(this.buff);
		return true;
	}
}

export default IncDefense;
