import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import {Colors} from '../util/Constants.js';
import PassiveAbility from './PassiveAbility.js';

class Death extends PassiveAbility {
	constructor() {
		super(true);
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
