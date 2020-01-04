const makeEnum = require('../util/Enum');
const LinkedList = require('../util/LinkedList');
const {EPSILON, maxWhich, setMagnitude} = require('../util/Number');
const Bounds = require('./Bounds');

const Layers = makeEnum(
	'PASSIVE',              // intersects with everything
	'FRIENDLY_PROJECTILE',  // intersects with hostile units and passives
	'FRIENDLY_UNIT',        // intersects with hostile units, hostile projectiles, and passives
	'HOSTILE_PROJECTILE',   // intersects with friendly units and passives
	'HOSTILE_UNIT',         // intersects with friendly units, hostile units, friendly projectiles, and passives
	'UNIT_TRACKER',         // intersects with friendly and hostile units
	'IGNORE');              // intersects with nothing

const CollisionTypes = makeEnum(
	'OFF', // unused, unset/undefined instead
	'ON',
	'TRACK_ONLY', // tracks collisions but does not prevent movement
);

class IntersectionFinder {
	constructor() {
		this.collisions = Object.keys(Layers).map(() => []);
		this.boundsGroups = Object.keys(Layers).map(() => new LinkedList());

		this.initCollisions();
	}

	initCollisions() {
		// todo [medium] allow units to move through projectiles, while taking damage
		// passives intersect with everything
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.FRIENDLY_UNIT);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_PROJECTILE);
		this.addCollision(Layers.PASSIVE, Layers.HOSTILE_UNIT);

		// Projectiles intersect with opposing units un-symmetrically
		this.addCollision(Layers.FRIENDLY_PROJECTILE, Layers.HOSTILE_UNIT, false);
		this.addCollision(Layers.HOSTILE_PROJECTILE, Layers.FRIENDLY_UNIT, false);

		// friendly units intersect with hostile units
		this.addCollision(Layers.FRIENDLY_UNIT, Layers.HOSTILE_UNIT);

		// hostile units intersects with hostile units
		this.addCollision(Layers.HOSTILE_UNIT, Layers.HOSTILE_UNIT);

		// units trackers intersect with friendly and hostile units un-symmetrically
		this.addCollision(Layers.UNIT_TRACKER, Layers.FRIENDLY_UNIT, false);
		this.addCollision(Layers.UNIT_TRACKER, Layers.HOSTILE_UNIT, false);
	}

	addCollision(layer1, layer2, symmetric = true) {
		this.collisions[layer1][layer2] = CollisionTypes.ON;
		this.collisions[layer2][layer1] = symmetric ? CollisionTypes.ON : CollisionTypes.TRACK_ONLY;
	}

	addBounds(layer, bounds, reference) {
		return this.boundsGroups[layer].add({bounds, reference})
	}

	removeBounds(layer, item) {
		return this.boundsGroups[layer].remove(item);
	}

	hasIntersection(searchLayer, bounds) {
		let item = this.boundsGroups[searchLayer]
			.find(({bounds: iBounds}) => iBounds.intersects(bounds));
		return item && item.value.reference;
	}

	intersections(layer, bounds) {
		return this.collisions[layer].flatMap((_, iLayer) =>
			this.boundsGroups[iLayer]
				.filter(({bounds: iBounds}) => iBounds.intersects(bounds))
				.map(item => item.value.reference));
	}

	canMove(layer, bounds, dx, dy, magnitude, noSlide) {
		// if magnitude is -1, then <dx, dy> is not necessarily a unit vector, and its magnitude should be used
		if (magnitude === -1)
			({x: dx, y: dy, prevMagnitude: magnitude} = setMagnitude(dx, dy));

		if (!dx && !dy || magnitude <= 0)
			return {x: 0, y: 0, reference: [], trackedOnlyReferences: []};

		let moveX = 0, moveY = 0;

		let horizontal = dx <= 0 ? Bounds.Directions.LEFT : Bounds.Directions.RIGHT;
		let vertical = dy <= 0 ? Bounds.Directions.TOP : Bounds.Directions.BOTTOM;

		let intersectionReference, trackedOnlyReferences = [];
		if (dx && dy) {
			let {move, side, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackedOnlyReferences);

			moveX += dx * move;
			moveY += dy * move;
			magnitude -= move;

			if (!side || noSlide) {
				trackedOnlyReferences = trackedOnlyReferences.filter(([_, moveTracked]) => moveTracked <= move).map(([reference]) => reference);
				return {x: moveX, y: moveY, reference, trackedOnlyReferences};
			} else if (side === 1) {
				horizontal = Bounds.Directions.LEFT;
				dx = 0;
			} else {
				vertical = Bounds.Directions.TOP;
				dy = 0;
			}

			intersectionReference = reference;
		}

		let {move, reference} = this.checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackedOnlyReferences);
		moveX += dx * move;
		moveY += dy * move;
		magnitude -= move;
		trackedOnlyReferences = trackedOnlyReferences.filter(([_, moveTracked]) => moveTracked <= move).map(([reference]) => reference);

		return {x: moveX, y: moveY, reference: intersectionReference || reference, trackedOnlyReferences};
		// todo [low] return list of all intersection references
	}

	// moves bounds until intersecting of type ON
	// returns similar to checkMoveEntityIntersection in addition to reference, the closest ON collision type
	// trackOnlyReferencesSuperset is an output array that will be appended to for all TRACK_ONLY collisions encountered
	// trackOnlyReferencesSuperset will be partially filtered by distance < reference
	checkMoveEntitiesIntersection(layer, bounds, dx, dy, magnitude, horizontal, vertical, trackOnlyReferencesSuperset) {
		let side, reference;

		this.collisions[layer].forEach((collisionType, iLayer) =>
			this.boundsGroups[iLayer].forEach(({bounds: iBounds, reference: iReference}) => {
				if (iBounds === bounds)
					return;
				let iIntersection = IntersectionFinder.checkMoveEntityIntersection(bounds, dx, dy, magnitude, horizontal, vertical, iBounds);
				if (iIntersection)
					if (collisionType === CollisionTypes.ON) {
						({move: magnitude, side} = iIntersection);
						reference = iReference;
					} else
						trackOnlyReferencesSuperset.push([iReference, iIntersection.move])
			}));

		return {move: magnitude, side, reference};
	}

	// checks for intersection between bounds + movement & ibounds
	// returns undefined if no intersection
	// returns {move: how much can move until intersection, side: which side the intersection occurred (0 = none, 1 = horizontal, 2 = vertical)}
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

// todo [low] support rectangular mobile (rotating)entities
