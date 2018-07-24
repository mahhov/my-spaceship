const makeEnum = require('../util/Enum');

const KeyStates = makeEnum('UP', 'DOWN', 'PRESSED', 'RELEASED');

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: .5, y: .5};
		this.transformedMouse = {};

		document.addEventListener('keydown', event =>
			!event.repeat && this.handleKeyPress(event.key.toLowerCase()));

		document.addEventListener('keyup', event =>
			this.handleKeyRelease(event.key.toLowerCase()));

		document.addEventListener('mousemove', event =>
			this.handleMouseMove(event.x - mouseTarget.offsetLeft, event.y - mouseTarget.offsetTop));

		window.addEventListener('blur', () =>
			this.handleBlur());
	}

	handleKeyPress(key) {
		this.keys[key] = KeyStates.PRESSED;
	}

	handleKeyRelease(key) {
		this.keys[key] = KeyStates.RELEASED;
	}

	handleMouseMove(x, y) {
		this.mouse.x = x / this.mouseTargetWidth;
		this.mouse.y = y / this.mouseTargetHeight;
	}

	handleBlur() {
		Object.entries(this.keys)
			.filter(([, value]) => value === KeyStates.DOWN || value === KeyStates.PRESSED)
			.forEach(([key]) => this.keys[key] = KeyStates.RELEASED);
	}

	getKeyState(key) {
		return this.keys[key] || KeyStates.UP;
	}

	getRawMouse() {
		return this.mouse;
	}

	inverseTransformMouse(inverseTransformer) {
		this.transformedMouse.x = inverseTransformer.xit(this.mouse.x);
		this.transformedMouse.y = inverseTransformer.yit(this.mouse.y);
	}

	getMouse() {
		return this.transformedMouse;
	}

	expire() {
		Object.entries(this.keys)
			.forEach(([key, value]) => this.keys[key] = Controller.expireKey(value));
	}

	static expireKey(key) {
		switch (key) {
			case KeyStates.RELEASED:
				return KeyStates.UP;
			case KeyStates.PRESSED:
				return KeyStates.DOWN;
			default:
				return key;
		}
	}
}

Controller.KeyStates = KeyStates;

module.exports = Controller;
