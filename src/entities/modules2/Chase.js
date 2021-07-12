import makeEnum from '../../util/enum.js';
import Module2 from './Module2.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0});

class Chase extends Module2 {
	config(origin, speed, dirModule) {
		this.origin = origin;
		this.speed = speed;
		this.dirModule = dirModule;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			this.origin.safeMove(intersectionFinder, this.dirModule.dir.x, this.dirModule.dir.y, this.speed);
	}
}

// todo [medium] maybe chase can be a module used in a near/far module manager

Chase.Stages = Stages;

export default Chase;
