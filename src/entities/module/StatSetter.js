const makeEnum = require('../../util/Enum');

const Module = require('./Module');

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
