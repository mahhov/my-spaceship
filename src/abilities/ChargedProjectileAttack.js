const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ChargedProjectileAttack extends Ability {
	constructor() {
		super(30, 1, 12, 1, false, true);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		if (this.activeDuration === 0) {
			this.chargeBuff = this.chargeBuff || player.addBuff();
			this.chargeBuff.moveSpeed = -.5;
		}
		this.chargeBuff.drawGlow = this.chargeScale / 2;
		return true;
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .015, SPREAD = .1, SIZE = .02, TIME = 100, DAMAGE = .1;
		let damage = (1 + this.chargeScale) * DAMAGE;

		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y, SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			TIME, damage, true);
		map.addProjectile(projectile);
		this.chargeBuff.moveSpeed = 0;
		this.chargeBuff.drawGlow = 0;
	}

	get chargeScale() {
		return Math.min(this.activeDuration / 40, 1.5);
	}

	tempGetChannelBarFill() {
		return this.chargeScale / 1.5;
	}
}

module.exports = ChargedProjectileAttack;
