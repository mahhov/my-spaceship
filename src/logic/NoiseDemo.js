const Logic = require('./Logic');
const {NoiseSimplex, NoiseGradient} = require('../util/Noise');
const {rand} = require('../util/Number');
const Rect = require('../painter/Rect');

const THRESHOLD = .5;
const N = 200; // resolution
const NTH = 1 / N;
const NOISE_RANGE = 20; // feature sizes, bigger NOISE_RANGE means smaller features

class NoiseDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.results = [];
		let noise = new NoiseGradient(NOISE_RANGE);
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
		for (let x = 0; x < N; x++)
			for (let y = 0; y < N; y++) {
				if (this.results[x][y]) {
					let c = 0;
					this.painter.add(new Rect(x * NTH, y * NTH, 1 / N, 1 / N, {fill: true, color: `rgb(${c}, ${c}, ${c})`}));
				}
			}
	}
}

module.exports = NoiseDemo;
