import Graphics from './Graphics.js';

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
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, POINTS, true, graphicOptions);
	}
}

export default StarShip;
