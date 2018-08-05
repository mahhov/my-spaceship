const Logic = require('./Logic');
const Camera = require('../camera/Camera');
const Text = require('../painter/Text');
const Starfield = require('../starfield/Starfield');
const StarfieldNoise = require('../starfield/StarfieldNoise');

class StarfieldDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.camera = new Camera(0, 0, 1);
	}

	iterate() {
		this.periodicallySwapStarfield();
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
		this.starfield.paint(this.painter, this.camera);
		this.painter.add(new Text(.05, .05, this.noise ? 'noise' : 'rand', {color: '#fff'})); // todo [high] use actual color
	}

	periodicallySwapStarfield() {
		if (!this.iter) {
			this.iter = 100;
			this.noise = !this.noise;
			this.starfield = this.noise ? new StarfieldNoise(1, 1) : new Starfield(1, 1);
		}
		this.iter--;
	}
}

module.exports = StarfieldDemo;
