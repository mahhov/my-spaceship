const Entity = require('./Entity');
const Pool = require('../util/Pool');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	changeHealth(amount) {
		this.health.change(amount);
	}

	restoreHealth() {
		this.health.restore();
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}
}

module.exports = LivingEntity;
