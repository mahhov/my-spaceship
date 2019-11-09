const Ability = require('./Ability');
const {setMagnitude, randVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor() {
		super(3, 15, .6, 0, true, 0);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .01, SPREAD = .1, SIZE = .01, TIME = 50, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = randVector(VELOCITY * SPREAD);
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, true);
		map.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;
