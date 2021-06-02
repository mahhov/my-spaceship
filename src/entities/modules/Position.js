import makeEnum from '../../util/Enum.js';
import Vector from '../../util/Vector.js';
import Module from './Module.js';

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class Position extends Module {
	config(origin = null, randMinMag = 0, randMaxMag = 0) {
		this.origin = origin; // if null, will use target
		this.randMinMag = randMinMag;
		this.randMaxMag = randMaxMag;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE)
			({x: this.x, y: this.y} =
				Vector.fromObj(this.origin || target).add(Vector.fromRand(this.randMinMag, this.randMaxMag)));
	}
}

Position.Stages = Stages;

export default Position;
