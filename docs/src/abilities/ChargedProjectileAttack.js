import Projectile from '../entities/attack/Projectile.js';
import Buff from '../entities/Buff.js';
import Stat from '../playerData/Stat.js';
import {randVector, setMagnitude} from '../util/number.js';
import Ability from './Ability.js';

class ChargedProjectileAttack extends Ability {
	constructor(statManager) {
		super(statManager, 30, 1, 6, .1, false, 60);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		if (this.channelDuration === 0) {
			this.chargeBuff = new Buff(0, this.uiColor, 'Slow');
			this.chargeBuff.addStatValue(Stat.Ids.MOVE_SPEED, -.5);
			hero.addBuff(this.chargeBuff);
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = .01, SPREAD = .1, SIZE = .02, TIME = 50, DAMAGE = .1;
		let damage = (1 + this.channelRatio * 3) * DAMAGE;

		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y, SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			TIME, damage, true);
		map.addProjectile(projectile);
		this.chargeBuff.expire();
	}
}

export default ChargedProjectileAttack;
