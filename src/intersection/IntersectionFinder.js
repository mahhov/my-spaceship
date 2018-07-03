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

        let horizontal = -1, vertical = -1; // todo get rid of if's for x & y differentiation
        if (dx)
            horizontal = dx < 0 ? bounds.LEFT : bounds.RIGHT;
        if (dy)
            vertical = dy < 0 ? bounds.TOP : bounds.BOTTOM;

        if (horizontal + 1 && vertical + 1) {
            let [move, intersection] = this.canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical);

            magnitude -= move;
            moveX += dx * move;
            moveY += dy * move;
            if (magnitude <= 0)
                return [moveX, moveY];

            if (intersection === 1)
                horizontal = -1;
            else if (intersection === 2)
                vertical = -1;
        }

        if (horizontal + 1)
            moveX += this.canMoveOneDirection(layer, bounds, magnitude, horizontal) * Math.sign(dx); // todo avoid math.sign
        if (vertical + 1)
            moveY += this.canMoveOneDirection(layer, bounds, magnitude, vertical) * Math.sign(dy);

        return [moveX, moveY];
    }

    canMoveTwoDirections(layer, bounds, dx, dy, magnitude, horizontal, vertical) {
        let intersection; // 0 = none, 1 = horizontal, 2 = vertical

        this.boundsGroups[this.PASSIVE].forEach(iBounds => {
            let horizontalDelta = (iBounds.getOpposite(horizontal) - bounds.get(horizontal)) / dx;
            let verticalDelta = (iBounds.getOpposite(vertical) - bounds.get(vertical)) / dy;

            if (horizontalDelta > magnitude || verticalDelta > magnitude)
                return;

            let [maxDelta, whichDelta] = maxWhich(horizontalDelta, verticalDelta);
            horizontalDelta = Math.max(horizontalDelta, 0);
            verticalDelta = Math.max(verticalDelta, 0);

            let horizontalFarDelta = (iBounds.get(horizontal) - bounds.getOpposite(horizontal)) / dx;
            let verticalFarDelta = (iBounds.get(vertical) - bounds.getOpposite(vertical)) / dy;

            if (maxDelta >= 0 && maxDelta < Math.min(horizontalFarDelta, verticalFarDelta)) {
                magnitude = maxDelta;
                intersection = whichDelta + 1;
            }
        });

        return [magnitude, intersection];
    }

    canMoveOneDirection(layer, bounds, magnitude, direction) {
        let newBounds = bounds.copy(); // todo , newBounds needed?
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
