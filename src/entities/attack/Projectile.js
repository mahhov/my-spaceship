const Entity = require('../Entity');
const {IntersectionFinderLayers} = require('../../intersection/IntersectionFinder');
const RectC = require('../../painter/RectC');

class Projectile extends Entity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly) {
		let layer = friendly ? IntersectionFinderLayers.FRIENDLY_PROJECTILE : IntersectionFinderLayers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
	}

	update(intersectionFinder) {
		const FRICTION = .95;

		let moveXY = intersectionFinder.canMove(this.layer, this.bounds, this.vx, this.vy, -1, true);
		this.move(...moveXY);

		this.vx *= FRICTION;
		this.vy *= FRICTION;
		if (!this.time--)
			return true;

		// todo check intersection and do damage or expire
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.width, this.height));
	}
}

module.exports = Projectile;

// todo remove from intersection finder when expired
