const makeEnum = require('../../util/Enum');
const Module = require('./Module');
const Vector = require('../../util/Vector');
const {thetaToVector} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Rotate extends Module {
	config(origin, rate = 1 / 50, theta = 0, atTarget = false) {
		this.origin = origin;
		this.rate = rate;
		this.theta = theta;
		this.atTarget = atTarget;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;
		if (this.atTarget) {
			let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
			this.origin.setMoveDirection(delta.x, delta.y);
		} else {
			this.theta += this.rate;
			this.origin.setMoveDirection(...thetaToVector(this.theta));
		}
	}
}

Rotate.Stages = Stages;

module.exports = Rotate;
