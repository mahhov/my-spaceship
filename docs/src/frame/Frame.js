import Emitter from '../util/Emitter.js';

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

export default Frame;
