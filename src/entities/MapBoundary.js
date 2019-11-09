const Entity = require('./Entity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const RectGraphic = require('../graphics/RectGraphic');

class MapBoundary extends Entity {
	static createBoxBoundaries(width, height) {
		const b = .1;
		return [
			[-b / 2, height / 2, b, height + b * 2], // left
			[width / 2, -b / 2, width + b * 2, b], // top
			[width + b / 2, height / 2, b, height + b * 2], // right
			[width / 2, height + b / 2, width + b * 2, b], // bottom
		].map(xyWidthHeight =>
			new MapBoundary(...xyWidthHeight));
	}

	constructor(...xyWidthHeight) {
		super(...xyWidthHeight, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RectGraphic(xyWidthHeight[2], xyWidthHeight[3], {fill: true, color: Colors.Entity.MAP_BOUNDARY.get()}));
	}
}

module.exports = MapBoundary;
