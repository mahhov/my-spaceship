import makeEnum from '../../util/enum.js';
import {thetaToVector} from '../../util/number.js';
import Vector from '../../util/Vector.js';
import Module from './Module.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0});

class Rotate extends Module {
	config(origin, rate = 1 / 50, theta = 0, atTarget = false) {
		this.origin = origin;
		this.rate = rate;
		this.theta = theta;
		this.atTarget = atTarget;
	}

	apply(map, intersectionFinder, target) {
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

export default Rotate;
