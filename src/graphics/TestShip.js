const Graphics = require('./Graphics');
const Color = require('../util/Color');
const PathCreator = require('./PathCreator');

let INSIDE_COLOR = [1, .8, .8];
let OUTSIDE_COLOR = [.7, 0, 0];
let OUTSIDE_RADIUS = 1.4;
let OUTSIDE_THICKNESS = 80;
let DOT_SCALE = .2;
let DOT_COLOR = [1, 1, 1];

class TestShip extends Graphics { // todo [medium] rename all graphics classes with graphics suffix or none
	constructor(width, height) {
		super();

		let centerPoints = PathCreator.createCirclePoints();
		this.addPath(width, height, centerPoints, true, {fill: true, color: Color.from1(...INSIDE_COLOR).get()});
		this.addPath(width * OUTSIDE_RADIUS, height * OUTSIDE_RADIUS, centerPoints, true, {color: Color.from1(...OUTSIDE_COLOR).get(), thickness: OUTSIDE_THICKNESS});
		let dot = PathCreator.createCirclePoints(1, 6, 2, 0);
		this.addPath(width * DOT_SCALE, height * DOT_SCALE, dot, true, {fill: true, color: Color.from1(...DOT_COLOR).get()});
	}
}

module.exports = TestShip;
