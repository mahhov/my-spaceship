import PathCreator from './PathCreator.js';
import Graphics from './Graphics.js';

const POINTS = PathCreator.createCirclePoints();

class HexagonShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

export default HexagonShip;
