const LivingEntity = require('./LivingEntity');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const {setMagnitude} = require('../util/Numbers');
const Projectile = require('./attack/Projectile');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, '#0f0', 1, IntersectionFinderLayers.HOSTILE_UNIT);
	}

	update(logic, intersectionFinder) {
		let [dx, dy] = setMagnitude(Math.random() - .5, Math.random() - .5, 1);
		this.safeMove(intersectionFinder, dx, dy, this.speed);

		let projectile = new Projectile(this.x, this.y, .01, .01, dx * .01, dy * .01, 100, .001, false);
		logic.addProjectile(projectile);
	}
}

module.exports = Monster;
