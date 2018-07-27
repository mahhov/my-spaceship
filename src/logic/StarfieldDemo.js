const Logic = require('./Logic');
const Camera = require('../camera/Camera');
const Starfield = require('../starfield/Starfield');

class StarfieldDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);
		this.camera = new Camera(0, 0, 1);
		this.starfield = new Starfield();
	}

	iterate() {
		let {x, y} = this.controller.getRawMouse();
		this.camera.move({x: x - .5, y: y - .5}, {x, y});
		this.starfield.paint(this.painter, this.camera);
	}
}

module.exports = StarfieldDemo;
