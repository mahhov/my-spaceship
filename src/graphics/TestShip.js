const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];
const RECT_COLOR = Color.from255(240, 200, 230).get();

class TestShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPathXY(-.05, 0, width, height, RECT_POINTS, true,
			{fill: true, color: RECT_COLOR});
		this.addPathXY(.05, 0, width, height, RECT_POINTS, true,
			{fill: true, color: RECT_COLOR});
	}
}

module.exports = TestShip;
