import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import Ability from './Ability.js';

class Accelerate extends Ability {
	constructor() {
		super('Haste', 200, 1, 0, 0, true, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!this.channelDuration) {
			this.buff = new Buff(0, this.uiColor, 'Haste');
			this.buff.addStatValue(Stat.Ids.MOVE_SPEED, .3);
			hero.addBuff(this.buff);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		this.buff.expire();
	}
}

export default Accelerate;
