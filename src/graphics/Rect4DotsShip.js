const PathCreator = require('./PathCreator');
const Color = require('../util/Color');
const Graphics = require('./Graphics');

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];
const RECT_COLOR = Color.from255(240, 200, 230).get();

const DOT_SCALE = .2;
const DOT_POS = .3;
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 0, 0);
const DOT_COLOR = Color.from1(1, 1, 1).get();

class Rect4DotsShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, RECT_POINTS, true,
			{...graphicOptions, fill: 'double', color: RECT_COLOR});
		RECT_POINTS.forEach(([x, y]) =>
			this.addPathXY(
				x * width * DOT_POS, y * height * DOT_POS,
				width * DOT_SCALE, height * DOT_SCALE,
				DOT_POINTS, true, {fill: 'double', color: DOT_COLOR}));
	}
}

module.exports = Rect4DotsShip;
