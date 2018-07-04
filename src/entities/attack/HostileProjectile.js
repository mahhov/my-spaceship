const MobileEntity = require('../MobileEntity');
const Bounds = require('../../intersection/Bounds');
const RectC = require('../../painter/RectC');

class HostileProjectile extends MobileEntity {
	constructor(x, y, width, height, vx, vy, time, damage) {
		super(x, y, width, height);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
	}

	update(intersectionFinder) {
		const FRICTION = .95;

		let moveXY = intersectionFinder.canMove('layer-replace-me', this.getBounds(), this.vx, this.vy, -1, true);
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

module.exports = HostileProjectile;
