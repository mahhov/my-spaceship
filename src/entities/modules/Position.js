import makeEnum from '../../util/enum.js';
import Vector from '../../util/Vector.js';
import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class Position extends Module {
	config(origin = null, randMinMag = 0, randMaxMag = 0,
	       fixedOffset = new Vector(0, 0), directedOffset = new Vector(0, 0)) {
		this.origin = origin; // if null, will use target
		this.randMinMag = randMinMag;
		this.randMaxMag = randMaxMag;
		this.fixedOffset = fixedOffset;
		this.directedOffset = directedOffset;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.ACTIVE)
			return;
		let origin = this.origin || target;
		({x: this.x, y: this.y} =
			Vector.fromObj(origin)
				.add(Vector.fromRand(this.randMinMag, this.randMaxMag))
				.add(this.fixedOffset)
				.add(this.directedOffset.copy.rotateByCosSin(this.target.moveDirection.x, this.target.moveDirection.y)));
	}
}

Position.Stages = Stages;

export default Position;
