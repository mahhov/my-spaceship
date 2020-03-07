const Looper = require('../logic/Looper');
const Game = require('../logic/Game');
const GameEgg = require('../logic/GameEgg');
const GraphicsDemo = require('../logic/GraphicsDemo');
const StarfieldDemo = require('../logic/StarfieldDemo');
const NoiseDemo = require('../logic/NoiseDemo');
const MapDemo = require('../logic/MapDemo');
const InterfaceDemo = require('../logic/InterfaceDemo');
const RecordMp4 = require('../util/RecordMp4');

let canvas = document.querySelector('#canvas');
let logicButtonsRow = document.querySelector('#logic-buttons-row');
let looper = new Looper(canvas);

let logicCLasses = [
	Game,
	GameEgg,
	GraphicsDemo,
];

logicCLasses.forEach(LogicClass => {
	let button = document.createElement('button');
	button.textContent = LogicClass.name;
	button.addEventListener('click', () => {
		looper.setLogicClass(LogicClass);
		history.replaceState(null, '', `/${LogicClass.name}`);
	});
	logicButtonsRow.append(button);
});

let StartLogicClass = logicCLasses.find(LogicClass => `/${LogicClass.name}` === location.pathname) || logicCLasses[0];
looper.setLogicClass(StartLogicClass);

// window.r = RecordMp4;
// window.s = RecordMp4();
