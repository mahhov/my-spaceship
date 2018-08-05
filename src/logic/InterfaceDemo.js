const Logic = require('./Logic');
const Interface = require('../interface/Interface');
const Button = require('../interface/Button');

class InterfaceDemo extends Logic {
	constructor(controller, painter) {
		super(controller, painter);

		this.interface = new Button();
		this.interface.setPosition(.25, .25, .2, .04);
	}

	iterate() {
		this.interface.update(this.controller);
		this.interface.paint(this.painter);
	}
}

module.exports = InterfaceDemo;
