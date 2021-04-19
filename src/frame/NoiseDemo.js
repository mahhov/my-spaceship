const Frame = require('./Frame');
const {NoiseSimplex} = require('../util/Noise');
const {rand} = require('../util/Number');
const Color = require('../util/Color');
const Rect = require('../painter/Rect');
const RectC = require('../painter/RectC');
const Text = require('../painter/Text');

const THRESHOLD = .5;
const N = 200; // resolution
const NTH = 1 / N;
const DEFAULT_NOISE_RANGE = 20; // feature sizes, bigger noiseRange means smaller features

class NoiseDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
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

	update() {
		if (this.controller.getKeyState('arrowdown').pressed)
			this.noiseRange -= 5;
		if (this.controller.getKeyState('arrowup').pressed)
			this.noiseRange += 5;
		if (this.controller.getKeyState('arrowleft').pressed)
			this.noiseRange--;
		if (this.controller.getKeyState('arrowright').pressed)
			this.noiseRange++;
		if (this.controller.getKeyState(' ').pressed)
			this.reset();
	}

	paint() {
		for (let x = 0; x < N; x++)
			for (let y = 0; y < N; y++) {
				if (this.results[x][y]) {
					this.painterSet.uiPainter.add(new Rect(x * NTH, y * NTH, 1 / N, 1 / N, {fill: true, color: Color.BLACK.get()}));
					this.painterSet.uiPainter.add(new RectC(.1, .1, .03, .03, {fill: true, color: `#fff`}));
					this.painterSet.uiPainter.add(new Text(.1, .1, this.noiseRange));
				}
			}
	}
}

module.exports = NoiseDemo;
