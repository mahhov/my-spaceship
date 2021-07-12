import makeEnum from '../../util/enum.js';
import ModuleDeprecated from './ModuleDeprecated.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class Restore extends ModuleDeprecated {
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
