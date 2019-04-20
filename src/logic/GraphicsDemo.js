const Logic = require('./Logic');
const TestShip = require('../graphics/TestShip');
const {thetaToVector} = require('../util/Number');

const idf = a => a;

class GraphicsDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.w = .2;
		this.h = .2;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .1 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h);
		this.fakeCamera = {xt: idf, yt: idf, st: idf};
	}

	iterate() {
		this.ship = new TestShip(this.w, this.h); // makes it easy to plug in window variables in constructor to edit live
		let direction = thetaToVector(this.theta += this.dtheta);
		this.ship.paint(this.painterSet.painter, this.fakeCamera, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

module.exports = GraphicsDemo;
