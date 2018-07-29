const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude, thetaToUnitVector, rand} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const VELOCITY = .015, SPREAD = .1, SIZE = .01, TIME = 100, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, VELOCITY);
		let randv = setMagnitude(...thetaToUnitVector(rand(Math.PI * 2)), rand(VELOCITY * SPREAD));
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directv.x + randv.x, directv.y + randv.y, TIME, DAMAGE, true);
		map.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;
