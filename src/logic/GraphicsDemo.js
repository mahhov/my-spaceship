const Logic = require('./Logic');
const Color = require('../util/Color');
const TestShip = require('../graphics/WShip');
const {thetaToUnitVector} = require('../util/Number');

const idf = a => a;

class GraphicsDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.w = .03;
		this.h = .03;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .2 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h, {color: Color.from1(0, 0, 1)});
	}

	iterate() {
		let direction = thetaToUnitVector(this.theta += this.dtheta);
		this.ship.paint(this.painter, {xt: idf, yt: idf}, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

module.exports = GraphicsDemo;
