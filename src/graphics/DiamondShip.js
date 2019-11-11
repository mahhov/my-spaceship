const Graphics = require('./Graphics');

const POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

class DiamondShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super();
		this.addPath(width, height, POINTS, true, {fill, color, thickness});
	}
}

module.exports = DiamondShip;
