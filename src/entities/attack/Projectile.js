import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Rect from '../../painter/elements/Rect.js';
import {Colors} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import {randVector} from '../../util/number.js';
import Entity from '../Entity.js';
import EntityObserver from '../EntityObserver.js';
import DamageDust from '../particles/DamageDust.js';

class Projectile extends Entity {
	constructor(x, y, width, height, vx, vy, time, damage, friendly, observer) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_PROJECTILE : IntersectionFinder.Layers.HOSTILE_PROJECTILE;
		super(x, y, width, height, layer, observer);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
		this.damage = damage;
		this.color = friendly ? Colors.Entity.FRIENDLY_PROJECTILE.get() : Colors.Entity.HOSTILE_PROJECTILE.get();
		this.buffs = [];
	}

	addBuff(buff) {
		this.buffs.push(buff);
	}

	update(map, intersectionFinder) { // todo [low] fix naming disconnect, map refers to lasers and projectiles as projectiles. entities refer to laser and projectile as attacks. create projectile/attack parent class to have update interface
		const FRICTION = 1;

		let intersection = this.getQueuedEvents(EntityObserver.EventIds.INTERSECTION)[0]?.[0] || this.safeMove(intersectionFinder, this.vx, this.vy, -1, true).reference;

		if (intersection) {
			let damageDealt = intersection.changeHealth(-this.damage);
			if (intersection.health.isEmpty())
				this.observer.queueEvent(EntityObserver.EventIds.KILLED, intersection);
			else
				this.buffs.forEach(buff => intersection.addBuff(buff));
			this.observer.queueEvent(EntityObserver.EventIds.DEALT_DAMAGE, damageDealt);
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
		let coordinate = new Coordinate(this.x, this.y, this.width, this.height).align(Coordinate.Aligns.CENTER);
		painter.add(Rect.withCamera(camera, coordinate, {fill: true, color: this.color}));
	}
}

export default Projectile;
