import Graphics from './Graphics.js';

const NOSE = 6;
const LEG = 11, LEG_SPREAD = 6;
const JOINT = 6 / LEG;
const POINTS = [
	[0, 0],
	[0, NOSE],
	[0, 0],
	[-LEG_SPREAD, -LEG],
	[0, 0],
	[LEG_SPREAD, -LEG],
	[LEG_SPREAD * JOINT, -LEG * JOINT],
	[-LEG_SPREAD * JOINT, -LEG * JOINT]];

class AShip extends Graphics {
	constructor(width, height, {color} = {}) {
		super();
		this.addPath(width, height, POINTS, false, {color});
	}
}

export default AShip;
