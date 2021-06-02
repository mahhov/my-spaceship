import Entity from '../Entity.js';
import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Coordinate from '../../util/Coordinate.js';
import {Colors} from '../../util/Constants.js';
import Rect from '../../painter/elements/Rect.js';

class Dust extends Entity {
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
		let coordinate = new Coordinate(this.x, this.y, this.width, this.height).align(Coordinate.Aligns.CENTER);
		painter.add(Rect.withCamera(camera, coordinate, {color: Colors.Entity.DUST.get()}));
	}

}

export default Dust;
