const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor() {
		super(6, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		const VELOCITY = .014, SPREAD = .08, SIZE = .02, TIME = 30, DAMAGE = .1;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, hero.friendly);
		map.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;
