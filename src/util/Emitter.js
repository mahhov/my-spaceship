class Emitter {
	constructor() {
		this.emitHandlers = {};
	}

	emit(event, ...args) {
		this.emitHandlers[event]?.forEach(handler => handler(...args));
	}

	on(event, handler) {
		this.emitHandlers[event] = this.emitHandlers[event] || [];
		this.emitHandlers[event].push(handler);
	}

	bubble(event, emitter, rename = event) {
		this.on(event, (...args) => emitter.emit(rename, ...args));
	}
}

module.exports = Emitter;
