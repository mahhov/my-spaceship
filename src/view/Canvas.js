const Controller = require('../control/Controller');
const Painter = require('../painter/Painter');
const Logic = require('../logic/Game');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');

const sleep = milli =>
	new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const controller = new Controller(canvas);
const painter = new Painter(canvas);

const logic = new Logic(controller, painter);
// const logic = new GraphicsDemo(controller, painter);
// const logic = new StarfieldDemo(controller, painter);
// const logic = new NoiseDemo(controller, painter);
// const logic = new MapDemo(controller, painter);
// const logic = new InterfaceDemo(controller, painter);

let loop = async () => {
	while (true) {
		painter.clear();
		logic.iterate();
		painter.paint();
		controller.expire();
		await sleep(10);
	}
};

loop();
