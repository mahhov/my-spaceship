const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');

class LivingEntity extends Entity {
	constructor(x, y, size, speed, color, layer) {
		super(x, y, size, size, layer);
		this.speed = speed;
		this.currentHealth = this.health = 1;
		this.color = color;
	}

	isFullHealth() {
		return this.currentHealth === 1;
	}

	changeHealth(amount) {
		this.currentHealth = clamp(this.currentHealth + amount, 0, this.health);
	}

	getSpeed() {
		return this.speed;
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.width, this.height, this.color.get(), true));
	}
}

module.exports = LivingEntity;
