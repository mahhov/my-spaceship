const MobileEntity = require('./MobileEntity');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class LivingEntity extends MobileEntity {
	constructor(x, y, size, speed, color, paintUiRow) {
		super(x, y, size, size);
		this.speed = speed;
		this.health = 1;
		this.color = color;
		this.paintUiRow = paintUiRow;
		this.setBounds();
	}

	takeDamage(amount) {
		this.health = Math.max(this.health - amount, 0);
	}

	getSpeed() {
		return this.speed;
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.width, this.height, this.color, true));
	}

	paintUi(painter) {
		const MARGIN = .02, TOP = MARGIN * (1 + this.paintUiRow * 2), WIDTH = 1 - MARGIN * 2;
		const EMPTY_COLOR = '#f66', FILL_COLOR = '#09c';
		painter.add(new Rect(MARGIN, TOP, WIDTH, MARGIN, EMPTY_COLOR, true));
		painter.add(new Rect(MARGIN, TOP, WIDTH * this.health, MARGIN, FILL_COLOR, true));
		painter.add(new Rect(MARGIN, TOP, WIDTH, MARGIN, EMPTY_COLOR, false));
	}
}


module.exports = LivingEntity;
