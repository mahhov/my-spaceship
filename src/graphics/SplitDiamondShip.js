const Graphics = require('./Graphics');

const DIAMOND_POINTS = [
	[0, 1.5],
	[1, 0],
	[0, -1.5],
	[-1, 0]];

// const SPLIT_POINTS = [
// 	[-1, 0],
// 	[1, 0]];

class SplitDiamondShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, DIAMOND_POINTS, true, graphicOptions);
		// this.addPath(width, height, SPLIT_POINTS, false, {color: 'rgb(255,0,255)'});
	}
}

module.exports = SplitDiamondShip;
