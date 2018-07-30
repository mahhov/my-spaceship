const makeEnum = require('../../util/Enum');

const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Restore extends Module {
	config(origin) {
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.health = this.origin.maxHealth // todo make function when refactor health
	}
}

Restore.Stages = Stages;

module.exports = Restore;
