const {PI2, thetaToVector} = require('../util/Number');
const Graphics = require('./Graphics');
const {Colors} = require('../util/Constants');

const POINTS = [];
const N = 6;
for (let i = 0; i < N; i++) {
	let theta = i * PI2 / N;
	POINTS.push(thetaToVector(theta));
}

class OututPortalGraphic extends Graphics {
	constructor(width, height) {
		super();
		this.addPath(width, height, POINTS, {fill: true, color: Colors.Monsters.OutpostPortal.FILL.get()});
		this.addPath(width, height, POINTS, {color: Colors.Monsters.OutpostPortal.BORDER.get(), thickness: 3});
		this.addPath(width * .83, height * .83, POINTS, {color: Colors.Monsters.OutpostPortal.LINES.get(), thickness: 3});
		this.addPath(width * .5, height * .5, POINTS, {fill: true, color: Colors.Monsters.OutpostPortal.LINES.get()});
	}
}

module.exports = OututPortalGraphic;
