const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, color, layer) {
		super(x, y, width, height, layer);
		this.health = this.maxHealth = health;
		this.color = color;
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
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {fill: true, color: this.color.get()}));
	}
}

module.exports = LivingEntity;
