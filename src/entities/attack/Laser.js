import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Line from '../../painter/elements/Line.js';
import {Colors} from '../../util/constants.js';
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
			this.intersection.takeDamage(this.damage);

		return !this.time--;
	}

	paint(painter, camera) {
		painter.add(Line.withCamera(
			camera,
			this.x, this.y,
			this.x + this.moveX, this.y + this.moveY,
			this.width)
			.setOptions({fill: true, color: Colors.Entity.AREA_DEGEN.ACTIVE_FILL.get()}));
	}
}

export default Laser;
