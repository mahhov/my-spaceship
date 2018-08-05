const Bounds = require('../intersection/Bounds');
const {setMagnitude} = require('../util/Number');

class Entity {
	constructor(x, y, width, height, layer) {
		this.bounds = new Bounds();
		this.width = width;
		this.height = height;
		this.layer = layer;
		this.setPosition(x, y);
		this.moveDirection = {x: 0, y: 1};
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
		this.setBounds();
	}

	checkMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		return intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
	}

	safeMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		let moveXY = intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
		this.move(...moveXY);
		return moveXY[2];
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		if (dx || dy)
			this.moveDirection = setMagnitude(dx, dy);
		this.setBounds();
	}

	addIntersectionBounds(intersectionFinder) {
		this.intersectionHandle = intersectionFinder.addBounds(this.layer, this.bounds, this);
	}

	removeIntersectionBounds(intersectionFinder) {
		intersectionFinder.removeBounds(this.layer, this.intersectionHandle);
	}

	setBounds() {
		let halfWidth = this.width / 2;
		let halfHeight = this.height / 2;
		this.bounds.set(this.x - halfWidth, this.y - halfHeight, this.x + halfWidth, this.y + halfHeight);
	}

	changeHealth(amount) {
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}

	paintUi(painter, camera) {
	}
}

module.exports = Entity;
