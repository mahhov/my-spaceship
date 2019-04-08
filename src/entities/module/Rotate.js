const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const {thetaToVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Rotate extends Module {
	config(origin, rate = 1 / 50, theta = 0) {
		this.origin = origin;
		this.rate = rate;
		this.theta = theta;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			[this.origin.moveDirection.x, this.origin.moveDirection.y] = thetaToVector(this.theta += this.rate);
	}
}

Rotate.Stages = Stages;

module.exports = Rotate;
