const State = require('./State');

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: null, y: null};
		this.transformedMouse = {};
		this.mouseState = new State();

		document.addEventListener('keydown', event =>
			!event.repeat && this.handleKeyPress(event.key.toLowerCase()));

		document.addEventListener('keyup', event =>
			this.handleKeyRelease(event.key.toLowerCase()));

		document.addEventListener('mousemove', event =>
			this.handleMouseMove(event.x - mouseTarget.offsetLeft, event.y - mouseTarget.offsetTop));

		document.addEventListener('mousedown', () =>
			this.handleMousePress());

		document.addEventListener('mouseup', () =>
			this.handleMouseRelease());

		window.addEventListener('blur', () =>
			this.handleBlur());
	}

	handleKeyPress(key) {
		if (!this.keys[key])
			this.keys[key] = new State();
		this.keys[key].press();
	}

	handleKeyRelease(key) {
		if (!this.keys[key])
			this.keys[key] = new State();
		this.keys[key].release();
	}

	handleMouseMove(x, y) {
		this.mouse.x = x / this.mouseTargetWidth;
		this.mouse.y = y / this.mouseTargetHeight;
	}

	handleMousePress() {
		this.mouseState.press();
	}

	handleMouseRelease() {
		this.mouseState.release();
	}

	handleBlur() {
		Object.values(this.keys)
			.filter((state) => state.active)
			.forEach((state) => state.release());
	}

	// map key (e.g. 'z') to state
	getKeyState(key) {
		return this.keys[key] || (this.keys[key] = new State());
	}

	getRawMouse(defaultX = 0, defaultY = 0) {
		return this.mouse.x ? this.mouse : {x: defaultX, y: defaultY};
	}

	inverseTransformMouse(inverseTransformer) {
		this.transformedMouse.x = inverseTransformer.xit(this.mouse.x);
		this.transformedMouse.y = inverseTransformer.yit(this.mouse.y);
	}

	getMouse() {
		return this.transformedMouse;
	}

	getMouseState() {
		return this.mouseState;
	}

	expire() {
		Object.values(this.keys).forEach((state) => state.expire());
		this.mouseState.expire();
	}
}

module.exports = Controller;
