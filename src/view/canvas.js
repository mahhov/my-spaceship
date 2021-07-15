import Game from '../frame/Game.js';
import GameEgg from '../frame/GameEgg.js';
import GraphicsDemo from '../frame/GraphicsDemo.js';
import InterfaceDemo from '../frame/InterfaceDemo.js';
import Looper from '../frame/Looper.js';
import MapDemo from '../frame/MapDemo.js';
import NoiseDemo from '../frame/NoiseDemo.js';
import StarfieldDemo from '../frame/StarfieldDemo.js';
// import RecordMp4 from '../util/recordMp4.js';

let canvas = document.querySelector('#canvas');
let looper = new Looper(canvas);

let frameCLasses = [
	Game,
	GameEgg,
	GraphicsDemo,
	StarfieldDemo,
	NoiseDemo,
	MapDemo,
	InterfaceDemo,
];

let mode = new URLSearchParams(location.search).get('mode');
let StartFrameClass = frameCLasses.find(FrameClass => FrameClass.name === mode) || frameCLasses[0];
looper.setFrameClass(StartFrameClass);

// RecordMp4();
