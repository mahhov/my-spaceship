const LinkedList = require('../util/LinkedList');
const {maxWhich} = require('../util/Numbers');

class IntersectionFinder {
	constructor() {
		this.PASSIVE = 0; // intersects with everything
		this.FRIENDLY_PROJECTILE = 1; // intersects with hostile units and passives
		this.FRIENDLY_UNIT = 2; // intersects with hostile units, hostile projectiles, and passives
		this.HOSTILE_PROJECTILE = 3; // intersects with friendly units and passives
		this.HOSTILE_UNIT = 4; // intersects with friendly units, friendly projectiles, and passives

		let layers = [this.PASSIVE, this.FRIENDLY_PROJECTILE, this.FRIENDLY_UNIT, this.HOSTILE_PROJECTILE, this.HOSTILE_UNIT];
		this.collisions = layers.map(() => []);
		this.boundsGroups = layers.map(() => new LinkedList());

		this.initCollisions();
	}

	initCollisions() {
		// passives intersect with everything
		this.addCollision(this.PASSIVE, this.FRIENDLY_UNIT);
		this.addCollision(this.PASSIVE, this.FRIENDLY_PROJECTILE);
		this.addCollision(this.PASSIVE, this.FRIENDLY_UNIT);
		this.addCollision(this.PASSIVE, this.HOSTILE_PROJECTILE);
		this.addCollision(this.PASSIVE, this.HOSTILE_UNIT);

		// friendly projectiles intersect with hostile units and passives
		this.addCollision(this.FRIENDLY_PROJECTILE, this.HOSTILE_UNIT);

		// friendly units intersect with hostile units, hostile projectiles, and passives
		this.addCollision(this.FRIENDLY_UNIT, this.HOSTILE_UNIT);
		this.addCollision(this.FRIENDLY_UNIT, this.HOSTILE_PROJECTILE);

		// hostile projectiles intersect with friendly units and passives

		// hostile uints intersects with friendly units, friendly projectiles, and passives
	}

	addCollision(layer1, layer2) {
		this.collisions[layer1][layer2] = true;
		this.collisions[layer2][layer1] = true;
	}

	addBounds(layer, bounds) {
		return this.boundsGroups[layer].add(bounds)
	}

	canMove(layer, bounds, dx, dy, magnitude, noSlide) {
		// if magnitude is -1, then <dx, dy> is not necessarily a unit vector, and its magnitude should be used
		if (magnitude === -1) {
			magnitude = Math.sqrt(dx * dx + dy * dy);
			dx /= magnitude;
			dy /= magnitude;
		}

		if (!dx && !dy || magnitude <= 0)
			return [0, 0];

		let moveX = 0, moveY = 0;

		let horizontal = dx <= 0 ? bounds.LEFT : bounds.RIGHT;
		let vertical = dy <= 0 ? bounds.TOP : bounds.BOTTOM;

		if (dx && dy) {
			let [move, intersection] = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);

			moveX += dx * move;
			moveY += dy * move;
			magnitude -= move;

			if (!intersection || noSlide)
				return [moveX, moveY];
			else if (intersection === 1) {
				horizontal = bounds.LEFT;
				dx = 0;
			} else {
				vertical = bounds.TOP;
				dy = 0;
			}
		}

		let [move] = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);
		moveX += dx * move;
		moveY += dy * move;

		return [moveX, moveY];
	}

	checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
		let magnitudeIntersectionPair = [magnitude]; // 2nd index for intersection: 0 = none, 1 = horizontal, 2 = vertical

		this.collisions[layer].forEach((_, iLayer) =>
			this.boundsGroups[iLayer].forEach(iBounds =>
				magnitudeIntersectionPair = IntersectionFinder.checkMoveEntityIntersection(bounds, dx, dy, magnitude, horizontal, vertical, iBounds) || magnitudeIntersectionPair));

		return magnitudeIntersectionPair;
	}

	static checkMoveEntityIntersection(bounds, dx, dy, magnitude, horizontal, vertical, iBounds) {
		let horizontalDelta = IntersectionFinder.getDelta(horizontal, dx, bounds, iBounds, false);
		let verticalDelta = IntersectionFinder.getDelta(vertical, dy, bounds, iBounds, false);

		if (horizontalDelta >= magnitude || verticalDelta >= magnitude || horizontalDelta < 0 && verticalDelta < 0)
			return;

		let [maxDelta, whichDelta] = maxWhich(horizontalDelta, verticalDelta);

		let horizontalFarDelta = IntersectionFinder.getDelta(horizontal, dx, bounds, iBounds, true);
		let verticalFarDelta = IntersectionFinder.getDelta(vertical, dy, bounds, iBounds, true);

		if (maxDelta >= 0 && maxDelta < Math.min(horizontalFarDelta, verticalFarDelta))
			return [maxDelta, whichDelta + 1];
	}

	static getDelta(direction, d, bounds, iBounds, far) {
		if (d) {
			if (far)
				direction = bounds.oppositeDirection(direction);
			return (iBounds.getOpposite(direction) - bounds.get(direction)) / d;
		}

		return iBounds.getOpposite(direction) > bounds.get(direction) && iBounds.get(direction) < bounds.getOpposite(direction) ^ far
			? 0 : Infinity;
	}
}

module.exports = IntersectionFinder;
