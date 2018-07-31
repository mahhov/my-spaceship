class Trigger {
	constructor(triggerValue) {
		this.triggerValue = triggerValue;
	}

	trigger(value) {
		if (!this.triggered && value === this.triggerValue)
			return this.triggered = true;
	}

	untrigger() {
		this.triggered = false;
	}
}

module.exports = Trigger;
