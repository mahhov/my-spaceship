const MobileEntity = require('../MobileEntity');
const RectC = require('../../painter/RectC');

class Projectile extends MobileEntity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly) {
		super(x, y, width, height);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
		this.friendly = friendly;
	}

	update(intersectionFinder) {
		const FRICTION = .95;

		let moveXY = intersectionFinder.canMove(Projectile.getLayer(intersectionFinder, this.friendly), this.getBounds(), this.vx, this.vy, -1, true);
		this.move(...moveXY);

		this.vx *= FRICTION;
		this.vy *= FRICTION;
		if (!this.time--)
			return true;

		// todo check intersection and do damage or expire
	}

	isFriendly() {
		return this.friendly
	}

	static getLayer(intersectionFinder, friendly) {
		return friendly ? intersectionFinder.FRIENDLY_PROJECTILE : intersectionFinder.HOSTILE_PROJECTILE;
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.width, this.height));
	}
}

module.exports = Projectile;

// todo remove from intersection finder when expired
