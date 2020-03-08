const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');
const Buff = require('../entities/Buff');

class ShotgunAttack extends Ability {
	constructor() {
		super(50, 1, 12, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = ShotgunAttack.velocity, SPREAD = .15, SIZE = .02, DAMAGE = .1, REPEAT = 5;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		for (let i = 0; i < REPEAT; i++) {
			let randv = randVector(VELOCITY * SPREAD);
			let projectile = new Projectile(
				origin.x, origin.y,
				SIZE, SIZE,
				directv.x + randv[0], directv.y + randv[1],
				ShotgunAttack.getTime(hero), DAMAGE,
				hero.friendly);
			map.addProjectile(projectile);
		}
		return true;
	}

	static getTime(hero) {
		return 60 * Buff.attackRange(hero.buffs);
	}

	static get velocity() {
		return .014;
	}
}

module.exports = ShotgunAttack;
