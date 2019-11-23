const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const {setMagnitude} = require('../../util/Number');

const Stages = makeEnum('INACTIVE', 'AIMING', 'WARNING', 'DASHING');
const Phases = makeEnum('INACTIVE', 'AIMING', 'WARNING', 'DASHING');

class Dash extends ModuleManager {
	config(origin, distance, dashDuration) {
		this.origin = origin;
		this.distance = distance;
		this.dashDuration = dashDuration;
		this.target = {};
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage !== Stages.DASHING)
			this.collided = false;

		// stage should be equivalent to phase unless we've collided while dashing
		if (!this.collided)
			this.modulesSetStage(this.stage);

		if (this.stage === Stages.AIMING) {
			let delta = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.distance);
			this.target.x = this.origin.x + delta.x;
			this.target.y = this.origin.y + delta.y;
			this.dir = setMagnitude(delta.x, delta.y);

		} else if (this.stage === Stages.DASHING && !this.collided) {
			this.collided = this.origin.safeMove(intersectionFinder, this.dir.x, this.dir.y, this.distance / this.dashDuration, true).reference;
			if (this.collided) {
				this.modulesSetStage(Phases.INACTIVE);
				this.target.x = this.origin.x;
				this.target.y = this.origin.y;
			}
		}
	}
}

Dash.Stages = Stages;
Dash.Phases = Phases;

module.exports = Dash;
