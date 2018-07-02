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
        let moveDistance = 0;

        let horizontal = -1, vertical = -1;
        if (dx)
            horizontal = dx < 0 ? bounds.LEFT : bounds.RIGHT;
        if (dy)
            vertical = dy < 0 ? bounds.TOP : bounds.BOTTOM;

        if (horizontal + 1 && vertical + 1)
            return this.canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical);

        if (horizontal + 1)
            return this.canMoveOneDirection(layer, bounds, magnitude, horizontal);
        if (vertical + 1)
            return this.canMoveOneDirection(layer, bounds, magnitude, vertical);

        return 0;
    }

    canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
        this.boundsGroups[this.PASSIVE].forEach(iBounds => {
            let horizontalDelta = (iBounds.getOpposite(horizontal) - bounds.get(horizontal)) / dx;
            let verticalDelta = (iBounds.getOpposite(vertical) - bounds.get(vertical)) / dy;

            if (horizontalDelta > magnitude || verticalDelta > magnitude)
                return;

            horizontalDelta = Math.max(horizontalDelta, 0);
            verticalDelta = Math.max(verticalDelta, 0);

            let horizontalFarDelta = (iBounds.get(horizontal) - bounds.getOpposite(horizontal)) / dx;
            let verticalFarDelta = (iBounds.get(vertical) - bounds.getOpposite(vertical)) / dy;

            let maxDelta = Math.max(horizontalDelta, verticalDelta);
            if (maxDelta < Math.min(horizontalFarDelta, verticalFarDelta))
                magnitude = maxDelta;
        });

        return magnitude;
    }

    canMoveOneDirection(layer, bounds, magnitude, direction) {
        let newBounds = bounds.copy();
        newBounds.expand(direction, magnitude);

        // todo don't hardcode the passive layer
        this.boundsGroups[this.PASSIVE].forEach(iBounds => {
            if (newBounds.intersects(iBounds)) {
                newBounds.set(direction, iBounds.getOpposite(direction));
                magnitude = iBounds.getOpposite(direction) - bounds.get(direction);
            }
        });
        if (magnitude < 0)
            return 0;
        return magnitude;
    }
}

module.exports = IntersectionFinder;
