const Graphics = require('./Graphics');

const POINTS = [
	[1, .5],
	[3, 2],
	[2, -2],
	[0, -1],
	[-2, -2],
	[-3, 2],
	[-1, .5]];

class WShip extends Graphics {
	constructor(color, width, height) {
		super(color, width, height, POINTS);
	}
}

module.exports = WShip;
