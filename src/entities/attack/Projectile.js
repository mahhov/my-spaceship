const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {randVector} = require('../../util/Number');
const DamageDust = require('../particle/DamageDust');
const {Colors} = require('../../util/Constants');
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

	update(map, intersectionFinder) { // todo [medium] fix naming disconnect, map refers to lasers and projectiles as projectiles. entities refer to laser and projectile as attacks. create projectile/attcak parent class to have update iterface
		const FRICTION = .95;

		let intersection = this.safeMove(intersectionFinder, this.vx, this.vy, -1, true);

		if (intersection) {
			intersection.changeHealth(-this.damage);
			map.addParticle(new DamageDust(this.x, this.y, .005, ...randVector(.001), 100));
			return true;
		}

		if (!this.time--)
			return true;

		this.vx *= FRICTION;
		this.vy *= FRICTION;

		// todo [low] do damage when collided with (as opposed to when colliding)
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: Colors.Entity.PROJECTILE.get()}));
	}
}

module.exports = Projectile;
