const LivingEntity = require('./LivingEntity');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const Projectile = require('./attack/Projectile');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, '#0f0', 1, IntersectionFinderLayers.HOSTILE_UNIT);
	}

	update(logic) {
		let dx = Math.random() * this.speed * 2 - this.speed;
		let dy = Math.random() * this.speed * 2 - this.speed;
		this.move(dx, dy);

		let projectile = new Projectile(this.x, this.y, .01, .01, dx * 4, dy * 4, 100, .1, false);
		logic.addProjectile(projectile);
	}
}

module.exports = Monster;

// todo check for intersections when moving
