const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const RectC = require('../../painter/RectC');

class Projectile extends Entity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
	}

	update(intersectionFinder) {
		const FRICTION = .95;

		let intersection = this.safeMove(intersectionFinder, this.vx, this.vy, -1, true);

		if (intersection) {
			intersection.changeHealth(-this.damage);
			return true;
		}

		if (!this.time--)
			return true;

		this.vx *= FRICTION;
		this.vy *= FRICTION;

		// todo check expire and do damage when collided with
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height));
	}
}

module.exports = Projectile;
