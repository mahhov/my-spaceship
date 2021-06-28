import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import ModuleManager from './ModuleManager.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0, COOLDOWN: 0});
const Phases = makeEnum({UNTRIGGERED: 0, TRIGGERED: 0});

class Cooldown extends ModuleManager {
	config(duration) {
		this.cooldown = new Phase(duration, 0);
	}

	apply_(map, intersectionFinder, target) {
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

export default Cooldown;
