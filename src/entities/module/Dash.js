const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');
const {setMagnitude} = require('../../util/Number');
const {Colors} = require('../../util/Constants');
const RectC = require('../../painter/RectC');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'FINISH');
const Phases = makeEnum('AIMING', 'WARNING', 'DASHING', 'COMPLETED', 'COLLIDED');

class Dash extends ModuleManager {
	config(origin, aimDuration, distance, warningDuration, dashDuration, paintRange) {
		this.origin = origin;
		this.distance = distance;
		this.dashDuration = dashDuration;
		this.timing = new Phase(aimDuration, warningDuration, dashDuration, 0);
		this.modulesSetStage(0);
		this.paintRange = paintRange;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE) {
			this.modulesSetStage(Phases.COMPLETED);
			this.timing.setPhase(0);
			return;
		}

		if (this.phase === Phases.COLLIDED)
			this.modulesSetStage(Phases.COMPLETED);

		if (this.timing.sequentialTick())
			this.modulesSetStage(this.timing.get());

		if (this.stage === Stages.ACTIVE && (this.phase === Phases.COMPLETED || this.phase === Phases.COLLIDED)) {
			this.timing.setPhase(Phases.AIMING);
			this.modulesSetStage(Phases.AIMING);

		} else if (this.phase === Phases.AIMING) {
			let delta = setMagnitude(target.x - this.origin.x, target.y - this.origin.y, this.distance);
			this.target = {x: this.origin.x + delta.x, y: this.origin.y + delta.y};
			this.dir = setMagnitude(delta.x, delta.y);

		} else if (this.phase === Phases.DASHING) {
			let collided = this.origin.safeMove(intersectionFinder, this.dir.x, this.dir.y, this.distance / this.dashDuration);
			if (collided)
				this.modulesSetStage(Phases.COLLIDED)
		}
	}

	paint(painter, camera) {
		if (this.phase !== Phases.AIMING && this.phase !== Phases.WARNING && this.phase !== Phases.DASHING)
			return;
		painter.add(RectC.withCamera(
			camera,
			this.target.x,
			this.target.y,
			this.paintRange * 2,
			this.paintRange * 2,
			{color: Colors.Ability.WARNING_BORDER.get()}));
		painter.add(RectC.withCamera(
			camera,
			this.target.x,
			this.target.y,
			this.paintRange * 2,
			this.paintRange * 2,
			{fill: true, color: Colors.Ability.WARNING_FILL.get()}));
	}
}

Dash.Stages = Stages;

module.exports = Dash;