const Emitter = require('../util/Emitter');

// todo [low] rename Frame
class Logic extends Emitter {
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

module.exports = Logic;
