const makeEnum = require('../util/Enum');

const States = makeEnum('UP', 'DOWN', 'PRESSED', 'RELEASED');

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: null, y: null};
		this.transformedMouse = {};

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
		this.keys[key] = States.PRESSED;
	}

	handleKeyRelease(key) {
		this.keys[key] = States.RELEASED;
	}

	handleMouseMove(x, y) {
		this.mouse.x = x / this.mouseTargetWidth;
		this.mouse.y = y / this.mouseTargetHeight;
	}

	handleMousePress() {
		this.mouseState = States.PRESSED;
	}

	handleMouseRelease() {
		this.mouseState = States.RELEASED;
	}

	handleBlur() {
		Object.entries(this.keys)
			.filter(([, value]) => value === States.DOWN || value === States.PRESSED)
			.forEach(([key]) => this.keys[key] = States.RELEASED);
	}

	getKeyState(key) {
		return this.keys[key] || States.UP;
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
		Object.entries(this.keys)
			.forEach(([key, value]) => this.keys[key] = Controller.expireKey(value));
		this.mouseState = Controller.expireKey(this.mouseState);
	}

	static expireKey(key) {
		switch (key) {
			case States.RELEASED:
				return States.UP;
			case States.PRESSED:
				return States.DOWN;
			default:
				return key;
		}
	}

	static isActive(state) {
		return state === States.PRESSED || state === States.DOWN;
	}

	static isPressed(state) {
		return state === States.PRESSED;
	}
}

Controller.States = States;

module.exports = Controller;

// todo [high] replace isActive and isPressed with state class with getters
