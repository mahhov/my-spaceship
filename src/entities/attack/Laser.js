const Entity = require('../Entity');
const {IntersectionFinderLayers} = require('../../intersection/IntersectionFinder');
const Line = require('../../painter/Line');

class Projectile extends Entity {
	constructor(x, y, dx, dy, time, damage, friendly) {
		const THICKNESS = .001;
		let layer = friendly ? IntersectionFinderLayers.FRIENDLY_PROJECTILE : IntersectionFinderLayers.HOSTILE_PROJECTILE;
		super(x, y, THICKNESS, THICKNESS, layer);
		this.dx = dx;
		this.dy = dy;
		this.time = time;
		this.damage = damage;
	}

	update(intersectionFinder) {
		if (!this.moveX)
			[this.moveX, this.moveY, this.intersection] = this.checkMove(intersectionFinder, this.dx, this.dy, -1, true);

		if (this.time--)
			return;

		if (this.intersection)
			this.intersection.changeHealth(-this.damage);

		return true;
	}

	paint(painter) {
		painter.add(new Line(this.x, this.y, this.x + this.moveX, this.y + this.moveY));
	}
}

module.exports = Projectile;