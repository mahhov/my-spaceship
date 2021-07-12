import Emitter from './Emitter.js';

class PolledEmitter extends Emitter {
	constructor() {
		super();
		this.queue = [];
	}

	emit(event, ...args) {
		this.queue.push({event, args});
	}

	poll() {
		this.queue.forEach(({event, args}) => super.emit(event, ...args));
		this.queue = [];
	}
}

export default PolledEmitter;
