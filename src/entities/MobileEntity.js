const Bounds = require('../intersection/Bounds');

class MobileEntity {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.bounds = new Bounds();
		this.setBounds();
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		this.setBounds();
	}

	setIntersectionHandle(intersectionHandle) {
		this.intersectionHandle = intersectionHandle;
	}

	getBounds() {
		return this.bounds;
	}

	setBounds() {
		let halfWidth = this.width / 2;
		let halfHeight = this.height / 2;
		this.bounds.set(this.x - halfWidth, this.y - halfHeight, this.x + halfWidth, this.y + halfHeight);
	}
}


module.exports = MobileEntity;
