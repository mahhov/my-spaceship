import makeEnum from '../../util/enum.js';
import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class Chase extends Module {
	config(origin, speed, dirModule) {
		this.origin = origin;
		this.speed = speed;
		this.dirModule = dirModule;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.safeMove(intersectionFinder, this.dirModule.dir.x, this.dirModule.dir.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

export default Chase;
