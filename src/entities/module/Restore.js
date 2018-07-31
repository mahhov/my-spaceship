const makeEnum = require('../../util/Enum');
const Trigger = require('../../util/Trigger');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER');

class Restore extends Module {
	constructor() {
		super();
		this.trigger = new Trigger(Stages.TRIGGER);
	}

	config(origin) {
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE || this.trigger.trigger(this.stage))
			this.origin.health.restore(); // todo make function on living entity
		else if (this.stage === Stages.INACTIVE)
			this.trigger.untrigger();
	}
}

Restore.Stages = Stages;

module.exports = Restore;
