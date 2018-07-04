const LivingEntity = require('./LivingEntity');

class Monster extends LivingEntity {
	constructor(x, y) {
		super(x, y, .004, .04, '#0f0', 1);
	}

	moveRandomly() {
		let dx = Math.random() * this.speed * 2 - this.speed;
		let dy = Math.random() * this.speed * 2 - this.speed;

		super.move(dx, dy);
	}
}

module.exports = Monster;
