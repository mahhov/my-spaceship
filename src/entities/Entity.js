const Bounds = require('../intersection/Bounds');

class Entity {
	constructor(x, y, width, height, layer) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.layer = layer;
		this.bounds = new Bounds();
		this.setBounds();
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		this.setBounds();
	}

	addIntersectionBounds(intersectionFinder) {
		this.intersectionHandle = intersectionFinder.addBounds(this.layer, this.bounds);
	}

	removeIntersectionBounds(intersectionFinder) {
		intersectionFinder.removeBounds(this.layer, this.intersectionHandle);
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


module.exports = Entity;
