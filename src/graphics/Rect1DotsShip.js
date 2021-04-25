import PathCreator from './PathCreator.js';
import Color from '../util/Color.js';
import Graphics from './Graphics.js';

const RECT_POINTS = [
	[0, 1],
	[1, 0],
	[0, -1],
	[-1, 0]];

const DOT_SCALE = .2;
const DOT_POS = .2;
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 0, 0);
const DOT_COLOR = Color.from1(1, 1, 1).get();

class Rect4DotsShip extends Graphics {
	constructor(width, height, color) {
		super();
		this.addPath(width, height, RECT_POINTS, true, {fill: true, color});
		this.addPathXY(
			0, height * DOT_POS,
			width * DOT_SCALE, height * DOT_SCALE,
			DOT_POINTS, true, {fill: true, color: DOT_COLOR});
	}
}

export default Rect4DotsShip;
