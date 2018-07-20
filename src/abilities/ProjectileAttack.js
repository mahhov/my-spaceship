const Ability = require('./Ability');
const {UiCs} = require('../UiConstants');
const {setMagnitude, thetaToUnitVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class ProjectileAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(origin, direct, logic, intersectionFinder, player) {
		const VELOCITY = .015, SPREAD = .1, SIZE = .01, TIME = 100, DAMAGE = .001;
		let [directX, directY] = setMagnitude(direct.x, direct.y, VELOCITY);
		let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), Math.random() * VELOCITY * SPREAD);
		let projectile = new Projectile(origin.x, origin.y, SIZE, SIZE, directX + rdx, directY + rdy, TIME, DAMAGE, true);
		logic.addProjectile(projectile);
		return true;
	}
}

module.exports = ProjectileAttack;
