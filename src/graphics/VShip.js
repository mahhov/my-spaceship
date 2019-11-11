const Graphics = require('./Graphics');

const POINTS = [
	[0, 3], // front
	[2, -1], // right
	[0, -3], // back
	[-2, -1]]; // left

class VShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super();
		this.addPath(width, height, POINTS, true, {fill, color, thickness});
	}
}

module.exports = VShip;
