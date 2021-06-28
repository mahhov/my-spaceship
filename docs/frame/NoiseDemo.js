import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import Color from '../util/Color.js';
import Coordinate from '../util/Coordinate.js';
import {NoiseSimplex} from '../util/noise.js';
import {rand} from '../util/number.js';
import Frame from './Frame.js';

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
					this.painterSet.uiPainter.add(new Rect(new Coordinate(x * NTH, y * NTH, 1 / N)).setOptions({fill: true, color: Color.BLACK.get()}));
					this.painterSet.uiPainter.add(new Rect(new Coordinate(.1, .1, .03).align(Coordinate.Aligns.CENTER)).setOptions({fill: true, color: `#fff`}));
					this.painterSet.uiPainter.add(new Text(new Coordinate(.1, .1), this.noiseRange).align(Coordinate.Aligns.CENTER));
				}
			}
	}
}

export default NoiseDemo;
