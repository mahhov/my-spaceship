const LivingEntity = require('./LivingEntity');
const Color = require('../util/Color');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const {setMagnitude} = require('../util/Number');
const Projectile = require('./attack/Projectile');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, Color.fromHex(0x0, 0xf, 0x0, true), IntersectionFinderLayers.HOSTILE_UNIT, 1);
	}

	update(logic, intersectionFinder) {
		let [dx, dy] = setMagnitude(Math.random() - .5, Math.random() - .5, 1);
		this.safeMove(intersectionFinder, dx, dy, this.speed);

		let projectile = new Projectile(this.x, this.y, .01, .01, dx * .01, dy * .01, 100, .005, false);
		logic.addProjectile(projectile);
	}
}

module.exports = Monster;
