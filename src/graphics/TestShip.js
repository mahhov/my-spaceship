const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const POINTS = PathCreator.createCirclePoints();
const COLOR = Color.from255(240, 200, 230).get();

class TestShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, POINTS, true,
			{fill: true, color: COLOR});
	}
}

module.exports = TestShip;
