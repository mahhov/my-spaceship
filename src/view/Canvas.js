const Looper = require('../logic/Looper');
const Game = require('../logic/Game');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');

let canvas = document.querySelector('#canvas');
let logicButtonsRow = document.querySelector('#logic-buttons-row');
let looper = new Looper(canvas);

[
	Game,
	GraphicsDemo,
].forEach(LogicClass => {
	let button = document.createElement('button');
	button.textContent = LogicClass.name;
	button.addEventListener('click', () => looper.setLogicClass(LogicClass));
	logicButtonsRow.append(button);
});

looper.setLogicClass(Game);
