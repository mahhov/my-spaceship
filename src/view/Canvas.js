const Controller = require('../control/Controller');
const PainterCompositor = require('../painter/PainterCompositor');
const FpsTracker = require('../util/FpsTracker');
const Game = require('../logic/Game');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');
const Text = require('../painter/Text');

const sleep = milli =>
	new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const controller = new Controller(canvas);
const painterSet = new PainterCompositor(canvas);
const fpsTracker = new FpsTracker();

const game = new Game(controller, painterSet);
// const graphicsDemo = new GraphicsDemo(controller, painterSet);
// const starfieldDemo = new StarfieldDemo(controller, painterSet);
// const noiseDemo = new NoiseDemo(controller, painterSet);
// const mapDemo = new MapDemo(controller, painterSet);
// const interfaceDemo = new InterfaceDemo(controller, painterSet);

const logic = game;

let loop = async () => {
	while (true) {
		painterSet.clear();
		logic.iterate();
		painterSet.uiPainter.add(new Text(.97, .03, fpsTracker.getFps()));
		painterSet.paint();
		controller.expire();
		await sleep(10);
	}
};

loop();
