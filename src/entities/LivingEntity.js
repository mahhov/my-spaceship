const Bounds = require('../intersection/Bounds');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class LivingEntity {
	constructor(x, y, speed, size, color, paintUiRow) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.size = size;
		this.health = 1;
		this.color = color;
		this.paintUiRow = paintUiRow;
		this.setBounds();
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		this.setBounds();
	}

	takeDamage(amount) {
		this.health = Math.max(this.health - amount, 0);
	}

	getX() {
		return x;
	}

	getY() {
		return y;
	}

	getSpeed() {
		return this.speed;
	}

	setIntersectionHandle(intersectionHandle) {
		this.intersectionHandle = intersectionHandle;
	}

	getBounds() {
		return this.bounds;
	}

	setBounds() {
		let halfSize = this.size / 2;
		this.bounds = new Bounds(this.x - halfSize, this.y - halfSize, this.x + halfSize, this.y + halfSize);
		// if (this.intersectionHandle)
		// 	this.intersectionHandle.value = this.bounds;
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.size, this.size, this.color, true));
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
