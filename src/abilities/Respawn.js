import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import {Colors} from '../util/constants.js';
import Pool from '../util/Pool.js';
import PassiveAbility from './PassiveAbility.js';

class Respawn extends PassiveAbility {
	constructor(statManager, delay, x, y) {
		super(statManager, true);
		this.delay = new Pool(delay, -1);
		this.x = x;
		this.y = y;
		this.deadBuff = new Buff(delay, Colors.PLAYER_BUFFS.DEAD, 'Dead');
		this.deadBuff.addStatValue(Stat.Ids.DISABLED, 1);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isEmpty() && this.delay.isFull()) {
			this.deadBuff.reset();
			hero.statManager.addBuff(this.deadBuff);
			this.dead = true;
		}

		if (!this.dead || !this.delay.increment())
			return false;

		this.delay.restore();
		hero.restoreHealth();
		hero.setPosition(this.x, this.y);
		this.deadBuff.expire();
		this.dead = false;
		return true;

		// todo [low] armor buff on respawn
	}
}

export default Respawn;
