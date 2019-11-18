const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {cos, sin} = require('../../util/Number');
const Vector = require('../../util/Vector');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed, dirModule) {
		this.origin = origin;
		this.speed = speed;
		this.dirModule = dirModule
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.safeMove(intersectionFinder, this.dirModule.dir.x, this.dirModule.dir.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;
