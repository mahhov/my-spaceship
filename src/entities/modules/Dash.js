import makeEnum from '../../util/enum.js';
import {setMagnitude} from '../../util/number.js';
import Module from './Module.js';

const Stages = makeEnum({INACTIVE: 0, AIMING: 0, WARNING: 0, DASHING: 0});

class Dash extends Module {
	config(origin, distance, dashDuration) {
		this.origin = origin;
		this.distance = distance;
		this.dashDuration = dashDuration;
		this.target = {};
	}

	apply(map, intersectionFinder, target) {
		if (this.stage !== Stages.DASHING)
			this.collided = null;

		if (this.stage === Stages.AIMING) {
			let delta = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.distance);
			this.target.x = this.origin.x + delta.x;
			this.target.y = this.origin.y + delta.y;
			this.dir = setMagnitude(delta.x, delta.y);

		} else if (this.stage === Stages.DASHING && !this.collided) {
			this.collided = this.origin.safeMove(intersectionFinder, this.dir.x, this.dir.y, this.distance / this.dashDuration, true).reference;
			if (this.collided) {
				this.emit('collide');
				this.target.x = this.origin.x;
				this.target.y = this.origin.y;
			}
		}

		this.lastStage = this.stage;
	}
}

Dash.Stages = Stages;

export default Dash;
