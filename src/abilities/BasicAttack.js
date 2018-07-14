const Ability = require('./Ability');
const {UiCs} = require('../UiConstants');
const {setMagnitude, thetaToUnitVector} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class BasicAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		[directX, directY] = setMagnitude(directX, directY, .015);
		let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), .015 * Math.random() * .1);
		let projectile = new Projectile(originX, originY, .01, .01, directX + rdx, directY + rdy, 100, .001, true);
		logic.addProjectile(projectile);
	}
}

module.exports = BasicAttack;
