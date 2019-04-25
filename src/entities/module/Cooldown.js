const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');
const Phase = require('../../util/Phase');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'COOLDOWN');
const Phases = makeEnum('UNTRIGGERED', 'TRIGGERED');

class Cooldown extends ModuleManager {
	config(duration) {
		this.cooldown = new Phase(duration, 0);
	}

	managerApply(map, intersectionFinder, target) {
		if (this.stage !== Stages.INACTIVE)
			this.cooldown.sequentialTick();
		if (this.cooldown.get() === 1 && this.stage === Stages.ACTIVE) {
			this.cooldown.setPhase(0);
			this.modulesSetStage(Phases.TRIGGERED);
		} else
			this.modulesSetStage(Phases.UNTRIGGERED);
	}
}

Cooldown.Stages = Stages;
Cooldown.Phases = Phases;

module.exports = Cooldown;
