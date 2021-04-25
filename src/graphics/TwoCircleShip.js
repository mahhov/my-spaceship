import {PI2, thetaToVector} from '../util/Number.js';
import Graphics from './Graphics.js';

let WIDTH = .3;
let LENGTH = .5;
let POINT = .4;
let FRAME_POINTS = [
	[0, LENGTH + POINT],
	[-WIDTH, LENGTH],
	[-WIDTH, -LENGTH],
	[0, -LENGTH - POINT],
	[WIDTH, -LENGTH],
	[WIDTH, LENGTH],
];

const FRONT_CIRCLE_POINTS = [];
const N = 6;
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	let [x, y] = thetaToVector(theta, POINT);
	FRONT_CIRCLE_POINTS.push([x, y + LENGTH]);
}

const BACK_CIRCLE_POINTS = [];
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	let [x, y] = thetaToVector(theta, POINT);
	BACK_CIRCLE_POINTS.push([x, y - LENGTH]);
}

class TwoCircleShip extends Graphics {
	constructor(width, height, graphicOptions = {}) {
		super();
		this.addPath(width, height, FRAME_POINTS, true, graphicOptions);
		this.addPath(width * WIDTH, height * WIDTH, FRONT_CIRCLE_POINTS, true, graphicOptions);
		this.addPath(width * WIDTH, height * WIDTH, BACK_CIRCLE_POINTS, true, graphicOptions);
	}
}

export default TwoCircleShip;
