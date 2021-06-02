import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Line from '../../painter/elements/Line.js';
import {Colors} from '../../util/Constants.js';
import Entity from '../Entity.js';

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
		({x: this.moveX, y: this.moveY, reference: this.intersection} =
			this.checkMove(intersectionFinder, this.dx, this.dy, -1, true));

		if (this.intersection)
			this.intersection.changeHealth(-this.damage);

		return !this.time--;
	}

	paint(painter, camera) {
		painter.add(Line.withCamera(
			camera,
			this.x, this.y,
			this.x + this.moveX, this.y + this.moveY,
			this.width,
			{fill: true, color: Colors.Entity.HOSTILE_PROJECTILE.get()}));
	}
}

export default Laser;
