const Graphics = require('./Graphics');
const {PI2, thetaToVector, rand} = require('../util/Number');

// min magnitude of all points will be MIN_MAGNITUDE / (MIN_MAGNITUDE + 1)
const POINTS = 5, MIN_MAGNITUDE = 1;

class RockGraphic extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		let points = [];
		for (let i = 0; i < POINTS; i++)
			points.push(thetaToVector(i * PI2 / POINTS, rand() + MIN_MAGNITUDE));
		super();
		this.addPath(width, height, points, true, {fill, color, thickness});
	}
}

module.exports = RockGraphic;
