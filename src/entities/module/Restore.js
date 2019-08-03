const makeEnum = require('../../util/Enum');
const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Restore extends Module {
	config(origin) {
		this.origin = origin;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.restoreHealth();
	}
}

Restore.Stages = Stages;

module.exports = Restore;
