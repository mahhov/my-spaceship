const makeEnum = require('../util/Enum');

const States = makeEnum('UP', 'DOWN', 'PRESSED', 'RELEASED');

class State {
	constructor() {
		this.set(State.UP);
	}

	set(state) {
		this.state = state;
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

module.exports = State;
