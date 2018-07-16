const {Controller} = require('./Controller');
const Painter = require('./painter/Painter');
const Logic = require('./Logic');
const Color = require('./util/Color');
const {thetaToUnitVector} = require('./util/Number');
const VShip = require('./graphics/VShip');

const sleep = milli =>
	new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const controller = new Controller(canvas);
const painter = new Painter(canvas);
const logic = new Logic(controller, painter);

let loop = async () => {
	while (true) {
		painter.clear();
		logic.iterate();
		painter.paint();
		controller.expire();
		await sleep(10);
	}
};

let GraphicsDemo = async () => {
	let x = .5, y = .5;
	let w = .03, h = .03;
	let theta = 0, dtheta = .2 * Math.PI / 180;

	while (true) {
		painter.clear();
		VShip(painter, x, y, w, h, thetaToUnitVector(theta += dtheta), new Color(0, 0, 1), new Color(1, 0, 0));
		painter.paint();
		await sleep(10);
	}
};

// loop();
GraphicsDemo();
