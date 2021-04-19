const Looper = require('../frame/Looper');
const Game = require('../frame/Game');
const GameEgg = require('../frame/GameEgg');
const GraphicsDemo = require('../frame/GraphicsDemo');
const StarfieldDemo = require('../frame/StarfieldDemo');
const NoiseDemo = require('../frame/NoiseDemo');
const MapDemo = require('../frame/MapDemo');
const InterfaceDemo = require('../frame/InterfaceDemo');
const RecordMp4 = require('../util/RecordMp4');

let canvas = document.querySelector('#canvas');
let frameButtonsRow = document.querySelector('#frame-buttons-row');
let looper = new Looper(canvas);

let frameCLasses = [
	Game,
	GameEgg,
	GraphicsDemo,
];

frameCLasses.forEach(FrameClass => {
	let button = document.createElement('button');
	button.textContent = FrameClass.name;
	button.addEventListener('click', () => {
		looper.setFrameClass(FrameClass);
		history.replaceState(null, '', `/${FrameClass.name}`);
	});
	frameButtonsRow.append(button);
});

let StartFrameClass = frameCLasses.find(FrameClass => `/${FrameClass.name}` === location.pathname) || frameCLasses[0];
looper.setFrameClass(StartFrameClass);

// window.r = RecordMp4;
// window.s = RecordMp4();
