const PassiveAbility = require('./PassiveAbility');
const Pool = require('../util/Pool');
const {Colors} = require('../util/Constants');
const Buff = require('../entities/Buff');

class Respawn extends PassiveAbility {
	constructor(delay, x, y) {
		super(true);
		this.delay = new Pool(delay, -1);
		this.x = x;
		this.y = y;
		this.deadBuff = new Buff(delay, Colors.PLAYER_BUFFS.DEAD, 'Dead');
		this.deadBuff.disabled = 1;
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (hero.health.isEmpty() && this.delay.isFull()) {
			this.deadBuff.reset();
			hero.addBuff(this.deadBuff);
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

		// todo [medium] armor buff on respawn
	}
}

module.exports = Respawn;
