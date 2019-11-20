const Graphics = require('./Graphics');

const POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

class DoubleHorizDiamond extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPathXY(-width/2, 0, width, height, POINTS, true, graphicOptions);
		this.addPathXY(width/2, 0, width, height, POINTS, true, graphicOptions);
	}
}

module.exports = DoubleHorizDiamond;
