const LivingEntity = require('./LivingEntity');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const Projectile = require('./attack/Projectile');

class Player extends LivingEntity {
	constructor(x, y) {
		super(x, y, .01, .004, '#000', 0, IntersectionFinderLayers.FRIENDLY_UNIT);
	}

	update(logic, controller, keymapping, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);

		let left = keymapping.isActive(controller, keymapping.MOVE_LEFT);
		let up = keymapping.isActive(controller, keymapping.MOVE_UP);
		let right = keymapping.isActive(controller, keymapping.MOVE_RIGHT);
		let down = keymapping.isActive(controller, keymapping.MOVE_DOWN);

		let dx = 0, dy = 0;

		if (left)
			dx -= 1;
		if (up)
			dy -= 1;
		if (right)
			dx += 1;
		if (down)
			dy += 1;

		if (dx === 0 && dy === 0)
			return;

		if (dx !== 0 && dy !== 0) {
			dx = Math.sign(dx) * invSqrt2;
			dy = Math.sign(dy) * invSqrt2;
		}

		this.safeMove(intersectionFinder, dx, dy, this.speed);

		let projectile = new Projectile(this.x, this.y, .01, .01, dx * .03, dy * .03, 100, .001, true);
		logic.addProjectile(projectile);
	}
}


module.exports = Player;
