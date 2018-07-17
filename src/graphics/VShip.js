const Graphics = require('./Graphics');

const SCALE = 1.25;
const POINTS = [
	[0, 1],
	[.5, 0],
	[0, -.5],
	[-.5, 0]];

class VShip extends Graphics {
	constructor(color, width, height) {
		super(color, width, height, SCALE, POINTS);
	}
}

module.exports = VShip;
