const Entity = require('../Entity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/elements/RectC');

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
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height, {color: Colors.Entity.DUST.get()}));
	}

}

module.exports = Dust;
