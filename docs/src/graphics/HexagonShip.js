import Graphics from './Graphics.js';
import PathCreator from './PathCreator.js';

const POINTS = PathCreator.createCirclePoints();

class HexagonShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

export default HexagonShip;
