const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
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
const painterSet = new PainterCompositor(canvas);

const logic = new Logic(controller, painterSet);
// const logic = new GraphicsDemo(controller, painterSet);
// const logic = new StarfieldDemo(controller, painterSet);
// const logic = new NoiseDemo(controller, painterSet);
// const logic = new MapDemo(controller, painterSet);
// const logic = new InterfaceDemo(controller, painterSet);

let loop = async () => {
	while (true) {
		painterSet.clear();
		logic.iterate();
		painterSet.paint();
		controller.expire();
		await sleep(10);
	}
};

loop();
