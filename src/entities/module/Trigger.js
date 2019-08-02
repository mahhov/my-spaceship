const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');

const Stages = makeEnum('INACTIVE', 'ACTIVE');
const Phases = makeEnum('INACTIVE', 'UNTRIGGERED', 'TRIGGERED');

class Trigger extends ModuleManager {
	config(duration) {
		this.duration = duration;
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage === Stages.ACTIVE && this.lastStage !== this.stage) {
			this.modulesSetStage(Phases.TRIGGERED);
			this.currentDuration = this.duration;
		} else if (this.currentDuration)
			this.currentDuration--;
		else if (this.stage === Stages.INACTIVE)
			this.modulesSetStage(Phases.INACTIVE);
		else if (this.lastStage === this.stage)
			this.modulesSetStage(Phases.UNTRIGGERED);
		else
			console.assert(false);
		this.lastStage = this.stage;
	}
}

Trigger.Stages = Stages;
Trigger.Phases = Phases;

module.exports = Trigger;
