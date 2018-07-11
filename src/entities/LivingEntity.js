const Entity = require('./Entity');
const {clamp} = require('../util/Number');
const RectC = require('../painter/RectC');
const UiCs = require('../UiConstants');
const WideBar = require('../painter/WideBar');

class LivingEntity extends Entity {
	constructor(x, y, size, speed, color, layer, paintUiRow) {
		super(x, y, size, size, layer);
		this.speed = speed;
		this.currentHealth = this.health = 1;
		this.color = color;
		this.paintUiRow = paintUiRow;
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
		painter.add(new WideBar(this.paintUiRow, this.currentHealth, UiCs.LIFE_EMPTY_COLOR, UiCs.LIFE_FILL_COLOR, UiCs.LIFE_EMPTY_COLOR));
	}
}

module.exports = LivingEntity;
