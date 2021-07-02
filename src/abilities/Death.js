import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {Colors} from '../util/constants.js';
import PassiveAbility from './PassiveAbility.js';

const statIds = TechniqueData.StatIds.TechniqueBase;

const BaseStats = {
	[statIds.COOLDOWN_DURATION]: [0, 1],
	[statIds.COOLDOWN_RATE]: [0, 1],
	[statIds.MAX_CHARGES]: [1, 1],
	[statIds.STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_STAMINA_COST]: [0, 1],
	[statIds.CHANNEL_DURATION]: [0, 1],
	[statIds.REPEATABLE]: [1, 1],
};

class Death extends PassiveAbility {
	constructor(statManager) {
		statManager.mergeBaseStats(BaseStats);
		super(statManager, true);
		this.deadBuff = new Buff(0, Colors.PLAYER_BUFFS.DEAD, 'Dead');
		this.deadBuff.addStatValue(Stat.Ids.DISABLED, 1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isEmpty()) {
			hero.addBuff(this.deadBuff);
			return true;
		}
		return false;
	}
}

export default Death;
