const PathCreator = require('./PathCreator');
const Graphics = require('./Graphics');

const POINTS = PathCreator.createCirclePoints();

class HexagonShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = HexagonShip;
