import makeEnum from '../../util/enum.js';
import {cos, sin} from '../../util/number.js';
import Vector from '../../util/Vector.js';
import Module2 from './Module2.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0, REVERSE: 0});

class Aim extends Module2 {
	config(origin, rotationSpeed = 0, skirmishTime = 0, skirmishDistance = 0, initialDirVector = null) {
		this.origin = origin;
		this.rotationSpeed = rotationSpeed;
		this.rotationSpeedCos = cos(rotationSpeed); // 0 rotationSpeed means instant rotation
		this.rotationSpeedSin = sin(rotationSpeed);
		this.skirmishTime = skirmishTime;
		this.skirmishDistance = skirmishDistance;
		if (initialDirVector) {
			this.dir = initialDirVector;
			this.dir.magnitude = 1;
		}
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			return;

		let delta = Vector.fromObj(target).subtract(Vector.fromObj(this.origin));
		if (this.stage === Stages.REVERSE)
			delta.negate();

		if (this.skirmishTime) {
			if (!this.skirmishTick) {
				this.skirmishTick = this.skirmishTime;
				this.skirmishVec = Vector.fromRand(this.skirmishDistance);
				if (this.skirmishVec.dot(delta) > 0)
					this.skirmishVec.negate();
			}
			this.skirmishTick--;
			delta.add(this.skirmishVec);
		}

		if (!this.dir) {
			this.dir = Vector.fromObj(delta);
			this.dir.magnitude = 1;
		} else if (this.rotationSpeed)
			this.dir.rotateByCosSinTowards(this.rotationSpeedCos, this.rotationSpeedSin, delta);
		else {
			this.dir = delta;
			this.dir.magnitude = 1;
		}
	}
}

Aim.Stages = Stages;

export default Aim;
