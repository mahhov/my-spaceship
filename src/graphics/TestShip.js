const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');
const Color = require('../util/Color');

let NOSE = 6;
let LEG = 11, LEG_SPREAD = 6;
let JOINT = 6 / LEG;
let framePoints = [
	[0, 0],
	[0, NOSE],
	[0, 0],
	[-LEG_SPREAD, -LEG],
	[0, 0],
	[LEG_SPREAD, -LEG],
	[LEG_SPREAD * JOINT, -LEG * JOINT],
	[-LEG_SPREAD * JOINT, -LEG * JOINT]
];

class TestShip extends Graphics { // todo [medium] rename all graphics classes with graphics suffix or none
	constructor(width, height) {
		super();
		this.addPath(width, height, framePoints, false, {thickness: 3 });
	}
}

module.exports = TestShip;
