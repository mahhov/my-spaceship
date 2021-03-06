import State from './State.js';

class Controller {
	constructor(mouseTarget) {
		this.mouseTargetWidth = mouseTarget.width;
		this.mouseTargetHeight = mouseTarget.height;

		this.keys = {};
		this.mouse = {x: null, y: null};
		this.transformedMouse = {};
		this.mouseStates = [new State(), new State(), new State()];

		document.addEventListener('keydown', event =>
			!event.repeat && this.handleKeyPress(event.key.toLowerCase(), event));

		document.addEventListener('keyup', event =>
			this.handleKeyRelease(event.key.toLowerCase()));

		document.addEventListener('mousemove', event =>
			this.handleMouseMove(event.x - mouseTarget.offsetLeft, event.y - mouseTarget.offsetTop));

		document.addEventListener('mousedown', event =>
			this.handleMousePress(event.button));

		document.addEventListener('mouseup', event =>
			this.handleMouseRelease(event.button));

		document.addEventListener('contextmenu', event =>
			event.preventDefault());

		window.addEventListener('blur', () =>
			this.handleBlur());
	}

	handleKeyPress(key, event) {
		if (key === 'tab')
			event.preventDefault();

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

	handleMousePress(button) {
		if (button < this.mouseStates.length)
			this.mouseStates[button].press();
	}

	handleMouseRelease(button) {
		if (button < this.mouseStates.length)
			this.mouseStates[button].release();
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

	getMouseState(button) {
		return this.mouseStates[button];
	}

	expire() {
		Object.values(this.keys).forEach((state) => state.expire());
		this.mouseStates.forEach(state => state.expire());
	}
}

export default Controller;
