const Bounds = require('../intersection/Bounds');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');

class Player {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.speed = .004;
		this.size = .01;
		this.health = 1;
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

	getIntersectionHandle() {
		return this.intersectionHandle;
	}

	getBounds() {
		return this.bounds;
	}

	setBounds() {
		let halfSize = this.size / 2;
		this.bounds = new Bounds(this.x - halfSize, this.y - halfSize, this.x + halfSize, this.y + halfSize);
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.size, this.size, 0, true));
	}

	paintUi(painter) {
		const MARGIN = .02, WIDTH = 1 - MARGIN * 2;
		const EMPTY_COLOR = '#f66', FILL_COLOR = '#09c';
		painter.add(new Rect(MARGIN, MARGIN, WIDTH, MARGIN, EMPTY_COLOR, true));
		painter.add(new Rect(MARGIN, MARGIN, WIDTH * this.health, MARGIN, FILL_COLOR, true));
		painter.add(new Rect(MARGIN, MARGIN, WIDTH, MARGIN, EMPTY_COLOR, false));
	}
}


module.exports = Player;
