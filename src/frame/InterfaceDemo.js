const Frame = require('./Frame');
const Button = require('../interface/Button');

class InterfaceDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.interface = new Button();
		this.interface.setPosition(.25, .25, .2, .04);
	}

	update() {
		this.interface.update(this.controller);
	}

	paint() {
		this.interface.paint(this.painterSet.uiPainter);
	}
}

module.exports = InterfaceDemo;
