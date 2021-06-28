import Graphics from './Graphics.js';

const POINTS = [
	[1, .5],
	[3, 2],
	[2, -2],
	[0, -1],
	[-2, -2],
	[-3, 2],
	[-1, .5]];

class WShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

export default WShip;
