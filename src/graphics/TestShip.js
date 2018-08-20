const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');
const Color = require('../util/Color');

let width = .3;
let length = .5;
let point = .4;
let framePoints = [
	[length + point, 0],
	[length, -width],
	[-length, -width],
	[-length - point, 0],
	[-length, width],
	[length, width],
];

const frontCirclePoints = [];
const N = 6;
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	let [x, y] = thetaToVector(theta, point);
	frontCirclePoints.push([x + length, y]);
}

const backCirclePoints = [];
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	let [x, y] = thetaToVector(theta, point);
	backCirclePoints.push([x - length, y]);
}

class TestShip extends Graphics { // todo [medium] rename all graphics classes with graphics suffix or none
	constructor(width, height) {
		super();
		this.addPath(width, height, framePoints, {color: Color.from1(1, .9, .9).get(), thickness: 3});
		this.addPath(width * .3, height * .3, frontCirclePoints, {color: Color.from1(1, .9, .9).get(), thickness: 3});
		this.addPath(width * .3, height * .3, backCirclePoints, {color: Color.from1(1, .9, .9).get(), thickness: 3});
	}
}

module.exports = TestShip;
