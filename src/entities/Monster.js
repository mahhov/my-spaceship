const LivingEntity = require('./LivingEntity');
const HostileProjectile = require('./attack/HostileProjectile');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .04, .004, '#0f0', 1);
	}

	update(logic) {
		let dx = Math.random() * this.speed * 2 - this.speed;
		let dy = Math.random() * this.speed * 2 - this.speed;
		this.move(dx, dy);

		let projectile = new HostileProjectile(this.x, this.y, .01, .01, dx * 4, dy * 4, 100, .1);
		logic.addHostileProjectile(projectile);
	}
}

module.exports = Monster;
