const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');

class LivingEntity extends Entity {
	constructor(x, y, width, height, speed, color, layer) {
		super(x, y, width, height, layer);
		this.speed = speed;
		this.health = this.maxHealth = 1;
		this.color = color;
	}

	isFullHealth() {
		return this.health === 1;
	}

	isEmptyHealth() {
		return !this.health;
	}

	changeHealth(amount) {
		this.health = clamp(this.health + amount, 0, this.maxHealth);
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {fill: true, color: this.color.get()}));
	}
}

module.exports = LivingEntity;
