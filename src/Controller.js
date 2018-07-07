class Controller {
	constructor(mouseTarget) {
		this.UP = 0;
		this.DOWN = 1;
		this.PRESSED = 2;
		this.RELEASED = 3;

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
		this.keys[key] = this.PRESSED;
	}

	handleKeyRelease(key) {
		this.keys[key] = this.RELEASED;
	}

	handleMouseMove(x, y) {
		this.mouse.x = x / this.mouseTargetWidth;
		this.mouse.y = y / this.mouseTargetHeight;
	}

	handleBlur() {
		Object.entries(this.keys)
			.filter(([, value]) => value === this.DOWN || value === this.PRESSED)
			.forEach(([key]) => this.keys[key] = this.RELEASED);
	}

	getKeyState(key) {
		return this.keys[key] || this.UP;
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
			case this.RELEASED:
				return this.UP;
			case this.PRESSED:
				return this.DOWN;
			default:
				return key;
		}
	}
}

module.exports = Controller;
