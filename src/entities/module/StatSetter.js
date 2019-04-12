const makeEnum = require('../../util/Enum');

const Module = require('./Module');

// todo create common parent class for StatSetter, PhaseSetter, and Restore; e.g., TriggerModule. Delete Trigger class.
const Stages = makeEnum('ACTIVE', 'INACTIVE');

class StatSetter extends Module {
	config(monster, stats) {
		this.monster = monster;
		this.stats = stats;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.monster.setStats(this.stats);
	}
}

StatSetter.Stages = Stages;

module.exports = StatSetter;
