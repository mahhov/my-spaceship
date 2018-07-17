const Graphics = require('./Graphics');

const POINTS = [
	[0, 3 / 2], // front
	[1, -1 / 2], // right
	[0, -3 / 2], // back
	[-1, -1 / 2]]; // left

class VShip extends Graphics {
	constructor(color, width, height) {
		super(color, width, height, POINTS);
	}
}

module.exports = VShip;
