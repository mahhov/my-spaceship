const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const {UiCs} = require('../UiConstants');
const WideBar = require('../painter/WideBar');

class LivingEntity extends Entity {
	constructor(x, y, size, speed, color, layer, uiIndex) {
		super(x, y, size, size, layer);
		this.speed = speed;
		this.currentHealth = this.health = 1;
		this.color = color;
		this.uiIndex = uiIndex;
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

	paintUi(painter) {
		painter.add(new WideBar(this.uiIndex, this.currentHealth, UiCs.LIFE_COLOR.multiply(.5).get(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.multiply(.5).get()));
	}
}

module.exports = LivingEntity;
