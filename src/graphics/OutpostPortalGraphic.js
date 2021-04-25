import Graphics from './Graphics.js';
import PathCreator from './PathCreator.js';
import Color from '../util/Color.js';

const INSIDE_COLOR = [1, .8, .8];
const OUTSIDE_COLOR = [.7, 0, 0];
const OUTSIDE_RADIUS = 1.4;
const OUTSIDE_THICKNESS = 80;
const DOT_SCALE = .2;
const DOT_COLOR = [1, 1, 1];
const DOT_POINTS = PathCreator.createCirclePoints(1, 6, 2, 0);
const CENTER_POINTS = PathCreator.createCirclePoints();

class OutpostPortalGraphic extends Graphics { // todo [medium] rename all graphics classes with graphics suffix or none
	constructor(width, height) {
		super();

		this.addPath(width, height, CENTER_POINTS, true, {fill: true, color: Color.from1(...INSIDE_COLOR).get()});
		this.addPath(width * OUTSIDE_RADIUS, height * OUTSIDE_RADIUS, CENTER_POINTS, true, {color: Color.from1(...OUTSIDE_COLOR).get(), thickness: OUTSIDE_THICKNESS});
		this.addPath(width * DOT_SCALE, height * DOT_SCALE, DOT_POINTS, true, {fill: true, color: Color.from1(...DOT_COLOR).get()});
	}
}

export default OutpostPortalGraphic;
