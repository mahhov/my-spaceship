import makeEnum from '../../util/enum.js';
import {getMagnitude} from '../../util/number.js';
import Module from './Module.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0});

class Distance extends Module {
	// distances should be in increasing order
	// if this.distances = [10, 20], then phase 1 = [10, 20)
	config(origin, ...distances) {
		this.origin = origin;
		this.distances = distances;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;

		let targetDistance = getMagnitude(target.x - this.origin.x, target.y - this.origin.y);

		let segment = this.distances.findIndex(distance => targetDistance < distance);
		if (segment === -1)
			segment = this.distances.length;
		this.emit('change', segment);
	}
}

Distance.Stages = Stages;

export default Distance;
