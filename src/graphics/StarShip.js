const Graphics = require('./Graphics');

const S = 1, D = .6, M = .3; // S = 1, D < .7, M < D

const POINTS = [
	[-S, 0], // left
	[-D, M],
	[-D, D],
	[-M, D],
	[0, S], // top
	[M, D],
	[D, D],
	[D, M],
	[S, 0], // right
	[D, -M],
	[D, -D],
	[M, -D],
	[0, -S], // bottom
	[-M, -D],
	[-D, -D],
	[-D, -M],
];

class StarShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, POINTS, {fill, color, thickness});
	}
}

module.exports = StarShip;
