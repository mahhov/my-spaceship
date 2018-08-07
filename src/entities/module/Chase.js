const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {setMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Chase extends Module {
	config(origin, speed) { // todo [high] order origin consistentiy between all module config methods
		this.origin = origin;
		this.speed = speed;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let {x: dx, y: dy} = setMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		this.origin.safeMove(intersectionFinder, dx, dy, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

module.exports = Chase;
