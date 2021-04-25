import PathCreator from './PathCreator.js';
import Color from '../util/Color.js';
import Graphics from './Graphics.js';

const POINTS = PathCreator.createCirclePoints();
const COLOR = Color.from255(240, 200, 230).get();

class TestShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, POINTS, true,
			{fill: true, color: COLOR});
	}
}

export default TestShip;
