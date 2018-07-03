const LinkedList = require('../util/LinkedList');
const {maxWhich} = require('../util/Numbers');

class IntersectionFinder {
	constructor() {
		this.PASSIVE = 0; // intersects with everything
		this.FRIENDLY_PROJECTILE = 1; // intersects with hostile units and passives
		this.FRIENDLY_UNIT = 2; // intersects with hostile units, hostile projectiles, and passives
		this.HOSTILE_PROJECTILE = 3; // intersects with friendly units and passives
		this.HOSTILE_UNIT = 4; // intersects with friendly units, friendly projectiles, and passives

		this.layers = [this.PASSIVE, this.FRIENDLY_PROJECTILE, this.FRIENDLY_UNIT, this.HOSTILE_PROJECTILE, this.HOSTILE_UNIT];

		this.boundsGroups = {};
		this.layers.forEach(layer => this.boundsGroups[layer] = new LinkedList());
	}

	addBounds(layer, bounds) {
		return this.boundsGroups[layer].add(bounds)
	}

	canMove(layer, bounds, dx, dy, magnitude) {
		if (!dx && !dy || magnitude <= 0)
			return [0, 0];

		let moveX = 0, moveY = 0;

		// todo get rid of if's for x & y differentiation
		let horizontal = dx <= 0 ? bounds.LEFT : bounds.RIGHT;
		let vertical = dy <= 0 ? bounds.TOP : bounds.BOTTOM;

		if (dx && dy) {
			let [move, intersection] = this.canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical);

			magnitude -= move;
			moveX += dx * move;
			moveY += dy * move;
			if (magnitude <= 0)
				return [moveX, moveY];

			if (intersection === 1) {
				horizontal = bounds.LEFT;
				dx = 0;
			} else if (intersection === 2) {
				vertical = bounds.TOP;
				dy = 0;
			}
		}

		let [move] = this.canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical);
		moveX += dx * move;
		moveY += dy * move;

		return [moveX, moveY];
	}

	canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
		let intersection; // 0 = none, 1 = horizontal, 2 = vertical

		this.boundsGroups[this.PASSIVE].forEach(iBounds => {
			let horizontalDelta = this.getDelta(horizontal, dx, bounds, iBounds, false);
			let verticalDelta = this.getDelta(vertical, dy, bounds, iBounds, false);

			if (horizontalDelta >= magnitude || verticalDelta >= magnitude || horizontalDelta < 0 && verticalDelta < 0)
				return;

			let [maxDelta, whichDelta] = maxWhich(horizontalDelta, verticalDelta);

			let horizontalFarDelta = this.getDelta(bounds.oppositeDirection(horizontal), dx, bounds, iBounds, true);
			let verticalFarDelta = this.getDelta(bounds.oppositeDirection(vertical), dy, bounds, iBounds, true);

			if (maxDelta >= 0 && maxDelta < Math.min(horizontalFarDelta, verticalFarDelta)) {
				magnitude = maxDelta;
				intersection = whichDelta + 1;
			}
		});

		return [magnitude, intersection];
	}

	getDelta(direction, d, bounds, iBounds, flipZero) {
		if (d)
			return (iBounds.getOpposite(direction) - bounds.get(direction)) / d;

		if (direction === bounds.RIGHT)
			direction = bounds.LEFT;
		if (direction === bounds.BOTTOM)
			direction = bounds.TOP;

		return iBounds.getOpposite(direction) > bounds.get(direction) && iBounds.get(direction) < bounds.getOpposite(direction) ^ flipZero
			? 0 : Infinity;
	}
}

module.exports = IntersectionFinder;
