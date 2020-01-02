const makeEnum = require('../../util/Enum');
const Module = require('./Module');

const Stages = makeEnum('ACTIVE', 'INACTIVE');

class BuffSetter extends Module {
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

module.exports = BuffSetter;
