import makeEnum from '../../util/Enum.js';
import {getMagnitude} from '../../util/Number.js';
import ModuleManager from './ModuleManager.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});
// variable number of phases per number of arguments to config

class Distance extends ModuleManager {
	// distances should be in increasing order
	// if this.distances = [10, 20], then phase 1 = [10, 20)
	config(origin, ...distances) {
		this.origin = origin;
		this.distances = distances;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		let phase = this.distances.findIndex(distance => targetDistance < distance);
		if (phase === -1)
			phase = this.distances.length;
		this.modulesSetStage(phase);
	}
}

Distance.Stages = Stages;

export default Distance;
