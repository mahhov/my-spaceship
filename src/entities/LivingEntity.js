const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../util/UiConstants');

const Charge = require('../util/Charge');

class LivingEntity extends Entity {
	constructor(x, y, width, height, health, layer) {
		super(x, y, width, height, layer);
		this.health = new Charge(health);
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	changeHealth(amount) {
		this.health.change(amount);
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}
}

module.exports = LivingEntity;
