const makeEnum = require('../../../util/Enum');
const MechanicalBossEarly = require('./MechanicalBossEarly');
const Phase = require('../../../util/Phase');
const Period = require('../../module/Period');
const Position = require('../../module/Position');
const AreaDegenLayer = require('../../module/AreaDegenLayer');

const Phases = makeEnum('ONE');

class MechanicalBoss extends MechanicalBossEarly {
	addModules() {
		super.addModules();
		this.addSurroundDegenModule();
		this.addChaseDegenModule();
	}

	addSurroundDegenModule() {
		let surroundDegenPeriod = new Period();
		surroundDegenPeriod.config(1, 38, 1);
		this.period.addModule(surroundDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.LOOP,
			2: Period.Stages.STOP,
			3: Period.Stages.STOP,
		});

		for (let i = 0; i < 1; i++) {
			let surroundDegenTarget = new Position();
			surroundDegenTarget.config(this, .2, .5);
			surroundDegenPeriod.addModule(surroundDegenTarget, {
				0: Position.Stages.ACTIVE,
				1: Position.Stages.INACTIVE,
				2: Position.Stages.INACTIVE,
			});

			let surroundDegen = new AreaDegenLayer();
			surroundDegen.config(surroundDegenTarget, .1, 200, .002);
			surroundDegenPeriod.addModule(surroundDegen, {
				0: AreaDegenLayer.Stages.INACTIVE,
				1: AreaDegenLayer.Stages.WARNING,
				2: AreaDegenLayer.Stages.ACTIVE,
			});
		}
	}

	addChaseDegenModule() {
		let chaseDegenPeriod = new Period();
		chaseDegenPeriod.config(1, 38, 1);
		this.period.addModule(chaseDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.STOP,
			2: Period.Stages.STOP,
			3: Period.Stages.LOOP,
		});

		let chaseDegenTarget = new Position();
		chaseDegenTarget.config();
		chaseDegenPeriod.addModule(chaseDegenTarget, {
			0: Position.Stages.ACTIVE,
			1: Position.Stages.INACTIVE,
			2: Position.Stages.INACTIVE,
		});

		let chaseDegen = new AreaDegenLayer();
		chaseDegen.config(chaseDegenTarget, .1, 200, .002);
		chaseDegenPeriod.addModule(chaseDegen, {
			0: AreaDegenLayer.Stages.INACTIVE,
			1: AreaDegenLayer.Stages.WARNING,
			2: AreaDegenLayer.Stages.ACTIVE,
		});
	}
}

module.exports = MechanicalBoss;
