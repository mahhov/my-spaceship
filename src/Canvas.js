const Controller = require('./Controller');
const Painter = require('./painter/Painter');
const Logic = require('./Logic');
const Color = require('./util/Color');
const {thetaToUnitVector} = require('./util/Number');
const TestShip = require('./graphics/WShip');

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
	let w = .03, h = .03;
	let x = .5, y = .5;
	let theta = 0, dtheta = .2 * Math.PI / 180;

	let ship = new TestShip(Color.from1(0, 0, 1), w, h);

	while (true) {
		painter.clear();
		let direction = thetaToUnitVector(theta += dtheta);
		ship.paint(painter, x, y, direction);
		painter.paint();
		await sleep(10);
	}
};

loop();
// GraphicsDemo();
