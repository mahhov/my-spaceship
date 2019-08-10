const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ChargedProjectileAttack extends Ability {
	constructor() {
		super(30, 1, 6, .3, false, 60);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (this.channelDuration === 0) {
			this.chargeBuff = this.chargeBuff || player.addBuff();
			this.chargeBuff.moveSpeed = -.5;
		}
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .015, SPREAD = .1, SIZE = .02, TIME = 100, DAMAGE = .1;
		let damage = (1 + this.channelRatio * 1.5) * DAMAGE;

		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y, SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			TIME, damage, true);
		map.addProjectile(projectile);
		this.chargeBuff.moveSpeed = 0;
	}
}

module.exports = ChargedProjectileAttack;
