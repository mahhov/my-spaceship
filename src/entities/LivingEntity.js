const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');

class LivingEntity extends Entity {
	constructor(x, y, width, height, speed, color, layer) {
		super(x, y, width, height, layer);
		this.speed = speed;
		this.currentHealth = this.health = 1;
		this.color = color;
	}

	isFullHealth() {
		return this.currentHealth === 1;
	}

	isEmptyHealth() {
		return !this.currentHealth;
	}

	changeHealth(amount) {
		this.currentHealth = clamp(this.currentHealth + amount, 0, this.health);
	}

	getSpeed() {
		return this.speed;
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, this.color.get(), true));
	}
}

module.exports = LivingEntity;
