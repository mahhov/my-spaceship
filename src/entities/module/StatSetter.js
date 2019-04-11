const makeEnum = require('../../util/Enum');
const Trigger = require('../../util/Trigger');

const Module = require('./Module');

// todo create common parent class for StatSetter, PhaseSetter, and Restore; e.g., TriggerModule. Delete Trigger class.
const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER');

class StatSetter extends Module {
	constructor() {
		super();
		this.trigger = new Trigger(Stages.TRIGGER);
	}

	config(monster, stats) {
		this.monster = monster;
		this.stats = stats;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE || this.trigger.trigger(this.stage))
			this.monster.setStats(this.stats);
		else if (this.stage === Stages.INACTIVE)
			this.trigger.untrigger();
	}
}

StatSetter.Stages = Stages;

module.exports = StatSetter;
