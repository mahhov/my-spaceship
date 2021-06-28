import Color from '../util/Color.js';
import Graphics from './Graphics.js';
import PathCreator from './PathCreator.js';

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

const DOT_SCALE = .15;
const DOT_POS = .25;
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 0, 0);
const DOT_COLOR = Color.from1(1, 1, 1).get();

class Rect4DotsShip extends Graphics {
	constructor(width, height, color) {
		super();
		this.addPath(width, height, RECT_POINTS, true, {fill: true, color});
		RECT_POINTS.forEach(([x, y]) =>
			this.addPathXY(
				x * width * DOT_POS, y * height * DOT_POS,
				width * DOT_SCALE, height * DOT_SCALE,
				DOT_POINTS, true, {fill: true, color: DOT_COLOR}));
	}
}

export default Rect4DotsShip;
