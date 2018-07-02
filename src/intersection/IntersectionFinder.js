const LinkedList = require('../util/LinkedList');

class IntersectionFinder {
    constructor() {
        this.PASSIVE = 0; // intersects with everything
        this.FRIENDLY_PROJECTILE = 1; // intersects with hostile units and passives
        this.FRIENDLY_UNIT = 2; // intersects with hostile units, hostile projectiles, and passives
        this.HOSTILE_PROJECTILE = 3; // intersects with friendly units and passives
        this.HOSTILE_UNIT = 4; // intersects with friendly units, friendly projectiles, and passives

        this.layers = [this.PASSIVE, this.FRIENDLY_PROJECTILE, this.FRIENDLY_UNIT, this.HOSTILE_PROJECTILE, this.HOSTILE_UNIT];

        this.entities = {};
        this.layers.forEach(layer => this.entities[layer] = new LinkedList());
    }

    addEntity(layer, bounds) {
        return this.entities[layer].add(bounds)
    }

    canMove(layer, bounds, dx, dy, magnitude) {
        if (dx === 0) {
            if (dy < 0) { // up
                return this.canMoveUp(layer, bounds, magnitude);
            }
        }
        return 0;
    }

    canMoveUp(layer, bounds, magnitude) {
        let newTop = bounds.getTop() - magnitude;
        let moveDistance = magnitude;
        // todo don't hardcode the passive layer
        this.entities[this.PASSIVE].forEach(entity => {
            if (entity.getLeft() < bounds.getRight() && entity.getTop() < bounds.getTop() && entity.getRight() > bounds.getLeft() && entity.getBottom() > newTop) {
                newTop = entity.getBottom();
                moveDistance = entity.getBottom() - bounds.getTop();
            }
        });
        if (moveDistance < 0)
            return 0;
        return moveDistance;
    }
}

module.exports = IntersectionFinder;
