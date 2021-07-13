import makeEnum from '../../util/enum.js';
import Module from './Module.js';

const Stages = makeEnum({INACTIVE: 0, ACTIVE: 0});

// Emits 'trigger' once when stage is set to active. Will emit 'end-trigger' after `duration`.
class Trigger extends Module {
	config(duration) {
		// duration should be > 0
		this.duration = duration;
	}

	apply(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			this.currentDuration = this.duration;
		else {
			if (this.currentDuration === this.duration)
				this.emit('trigger');
			else if (!this.currentDuration)
				this.emit('end-trigger');
			if (this.currentDuration > -1)
				this.currentDuration--;
		}
	}
}

Trigger.Stages = Stages;

export default Trigger;
