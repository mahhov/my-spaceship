const makeEnum = require('./util/Enum');

const KeyStates = makeEnum('UP', 'DOWN', 'PRESSED', 'RELEASED');

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: .5, y: .5};

		document.addEventListener('keydown', event =>
			!event.repeat && this.handleKeyPress(event.key));

		document.addEventListener('keyup', event =>
			this.handleKeyRelease(event.key));

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

	getMouse() {
		return this.mouse;
	}

	expire() {
		Object.entries(this.keys)
			.forEach(([key, value]) => this.keys[key] = this.expireKey(value));
	}

	expireKey(key) {
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

module.exports = {Controller, KeyStates};
