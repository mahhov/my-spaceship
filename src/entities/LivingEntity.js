const Entity = require('./Entity');
const Pool = require('../util/Pool');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Pool(health);
		this.stats = {armor: 1};
	}

	setStats(stats) {
		this.stats = {...this.stats, ...stats};
	}

	changeHealth(amount) {
		this.health.change(amount / this.stats.armor);
	}

	restoreHealth() {
		this.health.restore();
	}

	removeUi() {
		return this.health.isEmpty();
	}
}

module.exports = LivingEntity;
