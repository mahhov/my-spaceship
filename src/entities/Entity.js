import Bounds from '../intersection/Bounds.js';
import makeEnum from '../util/enum.js';
import {setMagnitude} from '../util/number.js';

const EventIds = makeEnum({INTERSECTION: 0});

class Entity {
	constructor(x, y, width, height, layer) {
		this.bounds = new Bounds();
		this.width = width;
		this.height = height;
		this.layer = layer;
		this.setPosition(x, y);
		this.moveDirection = {x: 0, y: 1};
		this.queuedEvents = [];
	}

	setGraphics(graphics) {
		this.graphics = graphics;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
		this.setBounds();
	}

	checkPosition(intersectionFinder) {
		return this.x !== undefined &&
			!intersectionFinder.intersections(this.layer, this.bounds).length;
	}

	checkMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		return intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
	}

	safeMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		let intersectionMove = intersectionFinder.canMove(this.layer, this.bounds, dx, dy, magnitude, noSlide);
		this.move(intersectionMove.x, intersectionMove.y);
		intersectionMove.trackedOnlyReferences.forEach(reference => reference.queueEvent(EventIds.INTERSECTION, this));
		return intersectionMove;
	}

	move(dx, dy) {
		this.x += dx;
		this.y += dy;
		this.setMoveDirection(dx, dy);
		this.setBounds();
	}

	setMoveDirection(dx, dy) {
		if (dx || dy)
			this.moveDirection = setMagnitude(dx, dy);
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

	queueEvent(eventId, ...args) {
		this.queuedEvents.push([eventId, ...args]);
	}

	getQueuedEvents(eventId) {
		return this.queuedEvents
			.filter(([eventIdI]) => eventIdI === eventId)
			.map(([_, ...args]) => args);
	}

	clearQueuedEvents(eventId) {
		this.queuedEvents = this.queuedEvents.filter(([eventIdI]) => eventIdI !== eventId);
	}

	changeHealth(amount) {
	}

	removeUi() {
		/* override, return true if ui is not longer relevant and should be removed from the ui queue */
	}

	paint(painter, camera) {
		this.graphics.paint(painter, camera, this.x, this.y, this.moveDirection);
	}

	paintUi(painter, camera) {
	}
}

Entity.EventIds = EventIds;

export default Entity;
