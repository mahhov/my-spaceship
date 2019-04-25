const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');
const {setMagnitude} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'FINISH');
const Phases = makeEnum('AIMING', 'WARNING', 'DASHING', 'COMPLETED');

class Dash extends ModuleManager {
	config(origin, aimDuration, distance, warningDuration, dashDuration, paintRange) {
		this.origin = origin;
		this.distance = distance;
		this.dashDuration = dashDuration;
		this.timing = new Phase(aimDuration, warningDuration, dashDuration, 0);
		this.modulesSetStage(0);
		this.paintRange = paintRange;
		this.target = {};
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE) {
			this.modulesSetStage(Phases.COMPLETED);
			this.timing.setPhase(0);
			return;
		}

		if (this.timing.sequentialTick())
			this.modulesSetStage(this.timing.get());

		if (this.stage === Stages.ACTIVE && this.phase === Phases.COMPLETED) {
			this.timing.setPhase(Phases.AIMING);
			this.modulesSetStage(Phases.AIMING);

		} else if (this.phase === Phases.AIMING) {
			let delta = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.distance);
			this.target.x = this.origin.x + delta.x;
			this.target.y = this.origin.y + delta.y;
			this.dir = setMagnitude(delta.x, delta.y);

		} else if (this.phase === Phases.DASHING) {
			let collided = this.origin.safeMove(intersectionFinder, this.dir.x, this.dir.y, this.distance / this.dashDuration);
			if (collided)
				this.modulesSetStage(Phases.COMPLETED)
		}
	}
}

Dash.Stages = Stages;
Dash.Phases = Phases;

module.exports = Dash;
