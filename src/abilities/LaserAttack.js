const Ability = require('./Ability');
const {Colors} = require('../util/Constants');
const {setMagnitude, randVector} = require('../util/Number');
const Laser = require('../entities/attack/Laser');

class LaserAttack extends Ability {
	constructor(paintUiColumn) {
		super(3, 15, .6, true, false, paintUiColumn, Colors.BASIC_ATTACK);
	}

	activate(origin, direct, map, intersectionFinder, player) {
		const RANGE = .15, SPREAD = .05, TIME = 10, DAMAGE = .001;
		let directv = setMagnitude(direct.x, direct.y, RANGE);
		let randv = randVector(RANGE * SPREAD);
		let laser = new Laser(origin.x, origin.y, directv.x + randv[0], directv.y + randv[1], TIME, DAMAGE, true);
		map.addProjectile(laser);
		return true;
	}
}

module.exports = LaserAttack;
