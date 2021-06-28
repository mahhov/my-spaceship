import makeEnum from '../../util/enum.js';
import ModuleManager from './ModuleManager.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0});
const Phases = makeEnum({INACTIVE: 0, UNTRIGGERED: 0, TRIGGERED: 0});

class Trigger extends ModuleManager {
	config(duration) {
		this.duration = duration;
	}

	apply_(map, intersectionFinder, target) {
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
			console.error('impossible branch reached.');
		this.lastStage = this.stage;
	}
}

Trigger.Stages = Stages;
Trigger.Phases = Phases;

export default Trigger;
