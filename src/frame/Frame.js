const Emitter = require('../util/Emitter');

class Frame extends Emitter {
	constructor(controller, painterSet) {
		super();
		this.controller = controller;
		this.painterSet = painterSet;
	}

	update() {
	}

	paint() {
	}
}

module.exports = Frame;
