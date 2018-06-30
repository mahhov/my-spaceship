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

}

module.exports = IntersectionFinder;
