const {Controller} = require('./Controller');
const Painter = require('./painter/Painter');
const Logic = require('./Logic');
const Color = require('./util/Color');
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

let GraphicsDemo = () => {
	painter.clear();
	VShip(painter, .5, .5, .03, .03, [0, 1], new Color(0, 0, 1), new Color(1, 0, 0));
	painter.paint();
};

// loop();
GraphicsDemo();
