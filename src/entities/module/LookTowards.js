const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class LookTowards extends Module {
	config(origin) {
		this.origin = origin;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		this.origin.setMoveDirection(target.x - this.origin.x, target.y - this.origin.y);
	}
}

LookTowards.Stages = Stages;

module.exports = LookTowards;
