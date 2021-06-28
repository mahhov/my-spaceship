class Emitter {
	constructor() {
		this.emitHandlers = {};
	}

	emit(event, ...args) {
		this.emitHandlers[event]?.forEach(handler => handler(...args));
	}

	on(event, handler) {
		this.emitHandlers[event] ||= [];
		this.emitHandlers[event].push(handler);
	}

	bubble(emitter, event, rename = event) {
		emitter.on(event, (...args) => this.emit(rename, ...args));
	}
}

export default Emitter;
