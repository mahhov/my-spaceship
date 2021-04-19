const Frame = require('./Frame');
const UiButton = require('../interface/components/UiButton');

class InterfaceDemo extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);

		this.interface = new UiButton(.25, .25, .2, .04, 'x');
	}

	update() {
		this.interface.update(this.controller);
	}

	paint() {
		this.interface.paint(this.painterSet.uiPainter);
	}
}

module.exports = InterfaceDemo;
