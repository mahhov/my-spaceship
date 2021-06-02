import TestShip from '../graphics/TestShip.js';
import {thetaToVector} from '../util/Number.js';
import Frame from './Frame.js';

const idf = a => a;

class GraphicsDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.w = .2;
		this.h = .2;
		this.x = .5;
		this.y = .5;
		this.theta = 0;
		this.dtheta = .05 * Math.PI / 180;
		this.ship = new TestShip(this.w, this.h);
		this.fakeCamera = {xt: idf, yt: idf, st: idf};
	}

	update() {
		this.ship = new TestShip(this.w, this.h); // makes it easy to plug in window variables in constructor to edit live
	}

	paint() {
		let direction = thetaToVector(this.theta += this.dtheta);
		this.ship.paint(this.painterSet.painter, this.fakeCamera, this.x, this.y, {x: direction[0], y: direction[1]});
	}
}

export default GraphicsDemo;
