const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {getMagnitude} = require('../../util/Number');

const Stages = makeEnum('ACTIVE', 'INACTIVE');
// variable number of phases per number of arguments to constructor

class Distance extends ModuleManager {
	// distances should be in increasing order
	// if this.distances = [10, 20], then phase 1 = [10, 20)
	config(origin, ...distances) {
		this.origin = origin;
		this.distances = distances;
	}

	// todo how is this working when target = 4th param, and origin = 3rd param
	managerApply(map, intersectionFinder, target) {
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

module.exports = Distance;
