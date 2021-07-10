import Buff from '../entities/Buff.js';
import BaseStats from '../playerData/BaseStats.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import Ability from './Ability.js';

const statIds = TechniqueData.StatIds.Defense;

const baseStats = new BaseStats({
	[statIds.COOLDOWN_DURATION]: [600, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [0, 0],
	[statIds.CHANNEL_STAMINA_COST]: [0, 0],
	[statIds.CHANNEL_DURATION]: [0, 0],
	[statIds.REPEATABLE]: [0, 0],
});

class IncDefense extends Ability {
	constructor(statManager) {
		statManager.mergeBaseStats(baseStats);
		super(statManager);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		this.buff = new Buff(200, this.uiColor, 'Armor');
		this.buff.addStatValue(Stat.Ids.ARMOR, 3);
		hero.addBuff(this.buff);
		return true;
	}
}

export default IncDefense;
