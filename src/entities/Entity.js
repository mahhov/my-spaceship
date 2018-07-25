const Bounds = require('../intersection/Bounds');
const {setMagnitude} = require('../util/Number');

class Entity {
	constructor(x, y, width, height, layer) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.layer = layer;
		this.bounds = new Bounds();
		this.setBounds();
		this.moveDirection = [0, 1];
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
			[this.moveDirection[0], this.moveDirection[1]] = setMagnitude(dx, dy); // todo avoid ugly stuff like this by returning {x, y, magnitude} instead of [x, y, magnitude]
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
	}
}


module.exports = Entity;
