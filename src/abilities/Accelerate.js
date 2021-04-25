import Ability from './Ability.js';
import Buff from '../entities/Buff.js';

class Accelerate extends Ability {
	constructor() {
		super(200, 1, 0, 0, true, -1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (!this.channelDuration) {
			this.buff = new Buff(0, this.uiColor, 'Speed');
			this.buff.moveSpeed = 3;
			hero.addBuff(this.buff);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		this.buff.expire();
	}
}

export default Accelerate;
