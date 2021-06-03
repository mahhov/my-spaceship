import makeEnum from '../../util/Enum.js';
import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

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

export default Restore;
