const LinkedList = require('../util/LinkedList');

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
        if (dx === 0 || dy === 0) {
            if (dx < 0)
                return this.canMoveOneDirection(layer, bounds, magnitude, bounds.LEFT);
            else if (dy < 0)
                return this.canMoveOneDirection(layer, bounds, magnitude, bounds.TOP);
            else if (dx > 0)
                return this.canMoveOneDirection(layer, bounds, magnitude, bounds.RIGHT);
            else
                return this.canMoveOneDirection(layer, bounds, magnitude, bounds.BOTTOM);
        }
        return 0;
    }

    canMoveOneDirection(layer, bounds, magnitude, direction) {
        let newBounds = bounds.copy();
        newBounds.expand(direction, magnitude);
        let moveDistance = magnitude;

        // todo don't hardcode the passive layer
        this.boundsGroups[this.PASSIVE].forEach(entity => {
            if (newBounds.intersects(entity)) {
                newBounds.set(direction, entity.getOpposite(direction));
                moveDistance = entity.getOpposite(direction) - bounds.get(direction);
            }
        });
        if (moveDistance < 0)
            return 0;
        return moveDistance;
    }
}

module.exports = IntersectionFinder;
