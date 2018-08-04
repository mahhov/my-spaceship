const Logic = require('./Logic');
const {NoiseSimplex, NoiseGradient} = require('../util/Noise');
const {rand} = require('../util/Number');
const Controller = require('../control/Controller');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');
const Text = require('../painter/Text');

const THRESHOLD = .5;
const N = 200; // resolution
const NTH = 1 / N;
const DEFAULT_NOISE_RANGE = 20; // feature sizes, bigger noiseRange means smaller features

class NoiseDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.noiseRange = DEFAULT_NOISE_RANGE;
		this.reset();
	}

	reset() {
		this.results = [];
		let noise = new NoiseSimplex(this.noiseRange);
		for (let x = 0; x < N; x++) {
			this.results[x] = [];
			for (let y = 0; y < N; y++) {
				let r = noise.get(x * NTH, y * NTH);
				if (r > THRESHOLD + rand())
					this.results[x][y] = true;
			}
		}
	}

	iterate() {
		this.control();
		this.paint();
	}

	control() {
		if (this.controller.getKeyState('arrowdown') === Controller.KeyStates.PRESSED)
			this.noiseRange -= 5;
		if (this.controller.getKeyState('arrowup') === Controller.KeyStates.PRESSED)
			this.noiseRange += 5;
		if (this.controller.getKeyState('arrowleft') === Controller.KeyStates.PRESSED)
			this.noiseRange--;
		if (this.controller.getKeyState('arrowright') === Controller.KeyStates.PRESSED)
			this.noiseRange++;
		if (this.controller.getKeyState(' ') === Controller.KeyStates.PRESSED)
			this.reset();
	}

	paint() {
		for (let x = 0; x < N; x++)
			for (let y = 0; y < N; y++) {
				if (this.results[x][y]) {
					let c = 0;
					this.painter.add(new Rect(x * NTH, y * NTH, 1 / N, 1 / N, {fill: true, color: `rgb(${c}, ${c}, ${c})`}));
					this.painter.add(new RectC(.1, .1, .03, .03, {fill: true, color: `#fff`}));
					this.painter.add(new Text(.1, .1, this.noiseRange));
				}
			}
	}
}

module.exports = NoiseDemo;
