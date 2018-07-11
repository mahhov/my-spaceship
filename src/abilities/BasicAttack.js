const Ability = require('./Ability');
const UiCs = require('../UiConstants');
const {setMagnitude} = require('../util/Number');
const Projectile = require('../entities/attack/Projectile');

class BasicAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(originX, originY, directX, directY, logic, intersectionFinder, player) {
		[directX, directY] = setMagnitude(directX, directY, .03);
		let projectile = new Projectile(originX, originY, .01, .01, directX, directY, 100, .001, true);
		logic.addProjectile(projectile);
	}
}

module.exports = BasicAttack;
