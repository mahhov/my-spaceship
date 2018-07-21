const Graphics = require('./Graphics');

const POINTS = [
	[0, 3 / 2], // front
	[1, -1 / 2], // right
	[0, -3 / 2], // back
	[-1, -1 / 2]]; // left

class VShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, POINTS, {fill, color, thickness});
	}
}

module.exports = VShip;
