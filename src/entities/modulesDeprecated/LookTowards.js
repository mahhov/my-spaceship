import makeEnum from '../../util/enum.js';
import ModuleDeprecated from './ModuleDeprecated.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class LookTowards extends ModuleDeprecated {
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
