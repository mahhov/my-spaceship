const Entity = require('./Entity');
const Pool = require('../util/Pool');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
	}

	changeHealth(amount) {
		this.health.change(amount);
	}

	restoreHealth() {
		this.health.restore();
	}
}

module.exports = LivingEntity;
