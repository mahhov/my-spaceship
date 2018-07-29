const Ability = require('./Ability');
const {UiCs} = require('../util/UiConstants');
const {setMagnitude, thetaToUnitVector} = require('../util/Number');
const Laser = require('../entities/attack/Laser');

class LaserAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, paintUiColumn, UiCs.BASIC_ATTACK_COLOR);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const RANGE = .15, SPREAD = .05, TIME = 10, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, RANGE);
		let randv = setMagnitude(...thetaToUnitVector(Math.random() * Math.PI * 2), Math.random() * RANGE * SPREAD); // todo x deprecate math.random() outside of util/numbers
		let laser = new Laser(origin.x, origin.y, directv.x + randv.x, directv.y + randv.y, TIME, DAMAGE, true);
		map.addProjectile(laser);
		return true;
	}
}

module.exports = LaserAttack;
