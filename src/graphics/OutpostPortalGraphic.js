const {PI2, thetaToVector, rand} = require('../util/Number');
const Graphics = require('./Graphics');
const Color = require('../util/Color');

const POINTS = [];
const N = 6;
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	POINTS.push(thetaToVector(theta``));
}

class OututPortalGraphic extends Graphics { // todo [high] refactor colors to ui constants
	constructor(width, height) {
		super();
		this.addPath(width, height, POINTS, {fill: true, color: Color.from1(1, .9, .9).get()});
		this.addPath(width, height, POINTS, {color: Color.from1(1, .5, .5).get(), thickness: 10});
		this.addPath(width * .83, height * .83, POINTS, {color: Color.from1(1, .95, .95).get(), thickness: 10});
		this.addPath(width * .5, height * .5, POINTS, {fill: true, color: Color.from1(1, .95, .95).get()});
	}
}

module.exports = OututPortalGraphic;
