const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');
const Color = require('../util/Color');

let points = [];
let n = 10;
for (let i = 0; i < n; i++) {
	let theta = i * PI2 / n;
	let vector = thetaToVector(theta);
	points.push(vector);
}

class TestShip extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, points, {fill: true, color: Color.from1(1, .9, .9).get()});
		this.addPath(width, height, points, {color: Color.from1(1, .5, .5).get(), thickness: 4});
	}
}

module.exports = TestShip;
