const Graphics = require('./Graphics');

const SCALE = .5;
const POINTS = [
	[0, 1], // front
	[1, -1 / 3], // right
	[0, -1], // back
	[-1, -1 / 3]]; // left

class VShip extends Graphics {
	constructor(color, width, height) {
		super(color, width, height, SCALE, POINTS);
	}
}

module.exports = VShip;
