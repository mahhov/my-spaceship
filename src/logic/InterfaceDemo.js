const Logic = require('./Logic');
const Button = require('../interface/Button');

class InterfaceDemo extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.interface = new Button();
		this.interface.setPosition(.25, .25, .2, .04);
	}

	iterate() {
		this.interface.update(this.controller);
		this.interface.paint(this.painterSet.uiPainter);
	}
}

module.exports = InterfaceDemo;
