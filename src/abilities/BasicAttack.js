const Ability = require('./Ability');
const {setMagnitude} = require('../util/Numbers');
const Projectile = require('../entities/attack/Projectile');

class BasicAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 0, 15, paintUiColumn, '#a44');
	}

	activate(originX, originY, directX, directY, logic) {
		[directX, directY] = setMagnitude(directX, directY, .03);
		let projectile = new Projectile(originX, originY, .01, .01, directX, directY, 100, .001, true);
		logic.addProjectile(projectile);
	}
}

module.exports = BasicAttack;
