const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');

let points = [];
let n = 20;
for (let i = 0; i < n; i++) {
	let theta = i * PI2 / n;
	let mag = rand() + 2;
	let vector = thetaToVector(theta, mag);
	points.push(vector);
}

class TestShip extends Graphics {
	constructor(width, height, {fill, color, thickness} = {}) {
		super(width, height, points, {fill, color, thickness});
	}
}

module.exports = TestShip;
