import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Module from './Module.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0, COOLDOWN: 0});

class Cooldown extends Module {
	config(duration) {
		this.cooldown = new Phase(duration, 0);
	}

	apply(map, intersectionFinder, target) {
		if (this.cooldown.get() === 0 && this.cooldown.isNew())
			this.emit('post-trigger');
		if (this.stage !== Stages.INACTIVE)
			this.cooldown.sequentialTick();
		if (this.cooldown.get() === 1 && this.stage === Stages.ACTIVE) {
			this.cooldown.setPhase(0);
			this.emit('trigger');
		}
	}
}

Cooldown.Stages = Stages;

export default Cooldown;
