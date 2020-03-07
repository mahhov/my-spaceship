const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');
const Buff = require('../entities/Buff');

class ProjectileAttack extends Ability {
	constructor() {
		super(6, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = ProjectileAttack.velocity, SPREAD = .08, SIZE = .02, DAMAGE = .1;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(
			origin.x, origin.y,
			SIZE, SIZE,
			directv.x + randv[0], directv.y + randv[1],
			ProjectileAttack.getTime(hero), DAMAGE,
			hero.friendly);
		map.addProjectile(projectile);
		return true;
	}

	static getTime(hero) {
		return 60 * Buff.attackRange(hero.buffs);
	}

	static get velocity() {
		return .014;
	}
}

module.exports = ProjectileAttack;
