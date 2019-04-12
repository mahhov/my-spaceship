const makeEnum = require('../../util/Enum');
const ModuleManager = require('./ModuleManager');

const Stages = makeEnum('ACTIVE', 'INACTIVE', 'TRIGGER', 'ALT_TRIGGER');
const Phases = makeEnum('UNTRIGGERED', 'TRIGGERED');

class Trigger extends ModuleManager {
	managerApply(map, intersectionFinder, target) {
		switch (this.stage) {
			case Stages.ACTIVE:
				this.modulesSetStage(Phases.TRIGGERED);
				break;
			case Stages.INACTIVE:
				this.modulesSetStage(Phases.UNTRIGGERED);
				break;
			case Stages.TRIGGER:
			case Stages.ALT_TRIGGER:
				this.modulesSetStage(this.lastStage !== this.stage ? Phases.TRIGGERED : Phases.UNTRIGGERED);
				break;
		}
		this.lastStage = this.stage;
	}
}

Trigger.Stages = Stages;
Trigger.Phases = Phases;

module.exports = Trigger;
