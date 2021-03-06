import Game from '../frame/Game.js';
import Looper from '../frame/Looper.js';
// import StarfieldDemo from '../frame/StarfieldDemo.js';
// import NoiseDemo from '../frame/NoiseDemo.js';
// import MapDemo from '../frame/MapDemo.js';
// import InterfaceDemo from '../frame/InterfaceDemo.js';
// import RecordMp4 from '../util/recordMp4.js';

let canvas = document.querySelector('#canvas');
let frameButtonsRow = document.querySelector('#frame-buttons-row');
let looper = new Looper(canvas);

let frameCLasses = [
	// Game,
	// GameEgg,
	// GraphicsDemo,
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

let StartFrameClass = frameCLasses.find(FrameClass => `/${FrameClass.name}` === location.pathname) || frameCLasses[0] || Game;
looper.setFrameClass(StartFrameClass);

// RecordMp4();
