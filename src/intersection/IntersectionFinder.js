const makeEnum = require('../util/Enum');
const LinkedList = require('../util/LinkedList');
const {EPSILON, maxWhich, setMagnitude} = require('../util/Number');
const Bounds = require('./Bounds');

const Layers = makeEnum(
	'PASSIVE',              // intersects with everything
	'FRIENDLY_PROJECTILE',  // intersects with hostile units and passives
	'FRIENDLY_UNIT',        // intersects with hostile units, hostile projectiles, and passives
	'HOSTILE_PROJECTILE',   // intersects with friendly units and passives
	'HOSTILE_UNIT');        // intersects with friendly units, friendly projectiles, and passives

class IntersectionFinder {
	constructor() {
		this.collisions = Object.keys(Layers).map(() => []);
		this.boundsGroups = Object.keys(Layers).map(() => new LinkedList());

		this.initCollisions();
	}

	initCollisions() {
		// passives intersect with everything
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_UNIT);

		// friendly projectiles intersect with hostile units and passives
		this.addCollision(Layers.FRIENDLY_PROJECTILE, Layers.HOSTILE_UNIT);

		// friendly units intersect with hostile units, hostile projectiles, and passives
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_UNIT);
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_PROJECTILE);

		// hostile projectiles intersect with friendly units and passives

		// hostile uints intersects with friendly units, friendly projectiles, and passives
	}

	addCollision(layer1, layer2) {
		this.collisions[layer1][layer2] = true;
		this.collisions[layer2][layer1] = true;
	}

	addBounds(layer, bounds, reference) {
		return this.boundsGroups[layer].add({bounds, reference})
	}

	removeBounds(layer, item) {
		return this.boundsGroups[layer].remove(item);
	}

	hasIntersection(layer, bounds) {
		let item = this.boundsGroups[layer].find(({bounds: iBounds}) =>
			iBounds.intersects(bounds));
		return item && item.value.reference;
	}

	canMove(layer, bounds, dx, dy, magnitude, noSlide) {
		// if magnitude is -1, then <dx, dy> is not necessarily a unit vector, and its magnitude should be used
		if (magnitude === -1)
			({x: dx, y: dy, prevMagnitude: magnitude} = setMagnitude(dx, dy));

		if (!dx && !dy || magnitude <= 0)
			return [0, 0];

		let moveX = 0, moveY = 0;

		let horizontal = dx <= 0 ? Bounds.Directions.LEFT : Bounds.Directions.RIGHT;
		let vertical = dy <= 0 ? Bounds.Directions.TOP : Bounds.Directions.BOTTOM;

		let intersectionReference;
		if (dx && dy) {
			let {move, side, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);

			moveX += dx * move;
			moveY += dy * move;
			magnitude -= move;

			if (!side || noSlide)
				return [moveX, moveY, reference];
			else if (side === 1) {
				horizontal = Bounds.Directions.LEFT;
				dx = 0;
			} else {
				vertical = Bounds.Directions.TOP;
				dy = 0;
			}

			intersectionReference = reference;
		}

		let {move, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical);
		moveX += dx * move;
		moveY += dy * move;

		return [moveX, moveY, intersectionReference || reference]; // todo don't return list
		// todo return list of all intersection references
	}

	checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
		let intersection = {move: magnitude}; // side: 0 = none, 1 = horizontal, 2 = vertical

		this.collisions[layer].forEach((_, iLayer) =>
			this.boundsGroups[iLayer].forEach(({bounds: iBounds, reference}) => {
				let iIntersection = IntersectionFinder.checkMoveEntityIntersection(bounds, dx, dy, intersection.move, horizontal, vertical, iBounds);
				if (iIntersection)
					intersection = {...iIntersection, reference};
			}));

		return intersection;
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
			return {move: Math.max(maxDelta - EPSILON, 0), side: whichDelta + 1};
	}

	static getDelta(direction, d, bounds, iBounds, far) {
		if (d) {
			if (far)
				direction = Bounds.oppositeDirection(direction);
			return (iBounds.getOpposite(direction) - bounds.get(direction)) / d;
		}

		return iBounds.getOpposite(direction) > bounds.get(direction) && iBounds.get(direction) < bounds.getOpposite(direction) ^ far
			? 0 : Infinity;
	}
}

IntersectionFinder.Layers = Layers;

module.exports = IntersectionFinder;

// todo support rectangular mobile (rotating)entities

// todo x consider hotstile entities colliding with themselves
