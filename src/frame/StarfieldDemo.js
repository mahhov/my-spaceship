const Frame = require('./Frame');
const Camera = require('../camera/Camera');
const Color = require('../util/Color');
const Text = require('../painter/elements/Text');
const Starfield = require('../starfield/Starfield');
const StarfieldNoise = require('../starfield/StarfieldNoise');

class StarfieldDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.camera = new Camera(0, 0, 1);
	}

	update() {
		this.periodicallySwapStarfield();
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
	}

	paint() {
		this.starfield.paint(this.painterSet.uiPainter, this.camera);
		this.painterSet.uiPainter.add(new Text(.05, .05, this.noise ? 'noise' : 'rand', {color: Color.WHITE.get()}));
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
