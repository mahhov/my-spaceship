const Bounds = require('../intersection/Bounds');

class Interface {
	setPosition(left, top, width, height) {
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		this.bounds = new Bounds(left, top, left + width, top + height);
	}

	update(controller) {
	}

	paint(painter) {
	}
}

module.exports = Interface;
