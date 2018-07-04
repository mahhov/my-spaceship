const Bounds = require('../intersection/Bounds');
const RectC = require('../painter/RectC');

class Destroyer {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.speed = .004;
		this.size = .04;
		this.setBounds();
	}

	moveRandomly() {
		let dx = Math.random() * this.speed * 2 - this.speed;
		let dy = Math.random() * this.speed * 2 - this.speed;

		this.x += dx;
		this.y += dy;
		this.setBounds();
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
		painter.add(new RectC(this.x, this.y, this.size, this.size, '#0f0', true));
	}
}

module.exports = Destroyer;
