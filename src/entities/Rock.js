const Entity = require('./Entity');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const RectC = require('../painter/RectC');

class Rock extends Entity {
	constructor(x, y, width, height) {
		super(x, y, width, height, IntersectionFinderLayers.PASSIVE);
	}

	paint(painter) {
		painter.add(new RectC(this.x, this.y, this.width, this.height));
	}
}

module.exports = Rock;
