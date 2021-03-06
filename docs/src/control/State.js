import makeEnum from '../util/enum.js';

// larger values have priority when multiple keys are mapped to the same control
const States = makeEnum({UP: 0, RELEASED: 0, PRESSED: 0, DOWN: 0});

class State {
	constructor(state = States.UP) {
		this.state = state;
	}

	static merge(...states) {
		return new State(Math.max(...states.map(state => state.state)));
	}

	press() {
		this.state = States.PRESSED;
	}

	release() {
		this.state = States.RELEASED;
	}

	expire() {
		if (this.state === States.RELEASED)
			this.state = States.UP;
		else if (this.state === States.PRESSED)
			this.state = States.DOWN;
	}

	get active() {
		return this.state === States.PRESSED || this.state === States.DOWN;
	}

	get pressed() {
		return this.state === States.PRESSED;
	}
}

State.States = States;

export default State;
