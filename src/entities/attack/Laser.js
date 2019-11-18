const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const Line = require('../../painter/Line');

class Laser extends Entity {
	constructor(x, y, dx, dy, width, time, damage, friendly) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, width, layer);
		this.dx = dx;
		this.dy = dy;
		this.time = time;
		this.damage = damage;
	}

	update(map, intersectionFinder) {
		[this.moveX, this.moveY, this.intersection] = this.checkMove(intersectionFinder, this.dx, this.dy, -1, true);

		if (this.intersection)
			this.intersection.changeHealth(-this.damage);

		return !this.time--;
	}

	paint(painter, camera) {
		// todo[med] draw width
		painter.add(Line.withCamera(camera, this.x, this.y, this.x + this.moveX, this.y + this.moveY));
	}
}

module.exports = Laser;
