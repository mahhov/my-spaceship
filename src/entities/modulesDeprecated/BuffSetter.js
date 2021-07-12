import makeEnum from '../../util/enum.js';
import ModuleDeprecated from './ModuleDeprecated.js';

const Stages = makeEnum({ACTIVE: 0, INACTIVE: 0});

class BuffSetter extends ModuleDeprecated {
	config(monster, buff) {
		this.monster = monster;
		this.buff = buff;
	}

	apply_(map, intersectionFinder, target) {
		if (this.stage === Stages.INACTIVE)
			this.buff.expire();
		else if (this.monster.addBuff(this.buff))
			this.buff.reset();
	}
}

BuffSetter.Stages = Stages;

export default BuffSetter;
