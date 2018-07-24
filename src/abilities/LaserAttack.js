const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude, thetaToUnitVector} = require('../util/Number');
const Laser = require('../entities/attack/Laser');

class LaserAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(origin, direct, logic, intersectionFinder, player) {
		const RANGE = .15, SPREAD = .05, TIME = 10, DAMAGE = .001;
		let [directX, directY] = setMagnitude(direct.x, direct.y, RANGE);
		let [rdx, rdy] = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), Math.random() * RANGE * SPREAD);
		let laser = new Laser(origin.x, origin.y, directX + rdx, directY + rdy, TIME, DAMAGE, true);
		logic.addProjectile(laser);
		return true;
	}
}

module.exports = LaserAttack;
