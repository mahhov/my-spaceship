import Graphics from './Graphics.js';
import {PI2, thetaToVector, rand} from '../util/Number.js';

// min magnitude of all points will be MIN_MAGNITUDE / (MIN_MAGNITUDE + 1)
const POINTS = 5, MIN_MAGNITUDE = 1;

class RockGraphic extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		let points = [];
		for (let i = 0; i < POINTS; i++)
			points.push(thetaToVector(i * PI2 / POINTS, rand() + MIN_MAGNITUDE));
		this.addPath(width, height, points, true, graphicOptions);
	}
}

export default RockGraphic;
