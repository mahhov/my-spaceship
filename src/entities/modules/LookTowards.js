import makeEnum from '../../util/enum.js';
import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class LookTowards extends Module {
	config(origin) {
		this.origin = origin;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		this.origin.setMoveDirection(target.x - this.origin.x, target.y - this.origin.y);
	}
}

LookTowards.Stages = Stages;

export default LookTowards;
