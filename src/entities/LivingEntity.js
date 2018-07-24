const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = this.maxHealth = health;
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	getHealthRatio() {
		return this.health / this.maxHealth;
	}

	isFullHealth() {
		return this.health === this.maxHealth;
	}

	isEmptyHealth() {
		return !this.health;
	}

	changeHealth(amount) {
		this.health = clamp(this.health + amount, 0, this.maxHealth);
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}
}

module.exports = LivingEntity;
