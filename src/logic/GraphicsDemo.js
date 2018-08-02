const Logic = require('./Logic');
const Color = require('../util/Color');
const TestShip = require('../graphics/TestShip');
const {thetaToVector} = require('../util/Number');

const idf = a => a;

class GraphicsDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.w = .3;
		this.h = .3;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .2 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h, {color: Color.from1(0, 0, 1)});
		this.fakeCamera = {xt: idf, yt: idf};
	}

	iterate() {
		let direction = thetaToVector(this.theta += this.dtheta);
		this.ship.paint(this.painter, this.fakeCamera, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

module.exports = GraphicsDemo;
