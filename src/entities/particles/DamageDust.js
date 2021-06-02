import Entity from '../Entity.js';
import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Coordinate from '../../util/Coordinate.js';
import {Colors} from '../../util/Constants.js';
import Rect from '../../painter/elements/Rect.js';

class DamageDust extends Entity {
	constructor(x, y, size, vx, vy, time) {
		super(x, y, size, size, IntersectionFinder.Layers.IGNORE);
		this.vx = vx;
		this.vy = vy;
		this.time = time;
	}

	update() {
		const FRICTION = .98;

		if (!this.time--)
			return true;

		this.move(this.vx, this.vy);

		this.vx *= FRICTION;
		this.vy *= FRICTION;
	}

	paint(painter, camera) {
		let coordinate = new Coordinate(this.x, this.y, this.width, this.height);
		painter.add(Rect.withCamera(camera, coordinate, {fill: true, color: Colors.Entity.DAMAGE_DUST.get()}));
	}

}

export default DamageDust;
