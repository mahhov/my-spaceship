const Graphics = require('./Graphics');

const POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

class DiamondShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

module.exports = DiamondShip;
