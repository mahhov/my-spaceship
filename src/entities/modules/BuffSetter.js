import makeEnum from '../../util/enum.js';
import Module from './Module.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class BuffSetter extends Module {
	config(monster, buff) {
		this.monster = monster;
		this.buff = buff;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			this.buff.expire();
		else if (this.monster.statManager.addBuff(this.buff))
			this.buff.reset();
	}
}

BuffSetter.Stages = Stages;

export default BuffSetter;
