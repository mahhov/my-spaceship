const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const RectC = require('../painter/RectC');

class Rock extends Entity {
	constructor(x, y, width, height) {
		super(x, y, width, height, IntersectionFinder.Layers.PASSIVE);
	}

	paint(painter, camera) {
		painter.add(RectC.withCamera(camera, this.x, this.y, this.width, this.height));
	}
}

module.exports = Rock;
