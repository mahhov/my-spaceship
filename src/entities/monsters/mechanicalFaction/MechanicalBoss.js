import makeEnum from '../../../util/enum.js';
import AreaDegenLayer from '../../modules/AreaDegenLayer.js';
import Period from '../../modules/Period.js';
import Position from '../../modules/Position.js';
import MechanicalBossEarly from './MechanicalBossEarly.js';

const Phases = makeEnum({ONE: 0});

class MechanicalBoss extends MechanicalBossEarly {
	// todo [low] set expValue higher than MechanicalBossEarly

	constructor(x, y) {
		super(x, y);

		// this.period = rest, laser + random degen, pause, shotgun + chasing degen

		let surroundDegenPeriod = this.addModule(new Period());
		surroundDegenPeriod.config(1, 38, 1);
		this.period.onChangeSetModuleStages(surroundDegenPeriod, Period.Stages.STOP, Period.Stages.LOOP, Period.Stages.STOP, Period.Stages.STOP);

		for (let i = 0; i < 1; i++) {
			let surroundDegenTarget = this.addModule(new Position());
			surroundDegenTarget.config(this, .2, .5);
			surroundDegenPeriod.onChangeSetModuleStages(surroundDegenTarget, Position.Stages.ACTIVE, Position.Stages.INACTIVE, Position.Stages.INACTIVE);

			let surroundDegen = this.addModule(new AreaDegenLayer());
			surroundDegen.config(surroundDegenTarget, .1, 200, .2);
			surroundDegenPeriod.onChangeSetModuleStages(surroundDegen, AreaDegenLayer.Stages.INACTIVE, AreaDegenLayer.Stages.WARNING, AreaDegenLayer.Stages.ACTIVE);
		}

		let chaseDegenPeriod = this.addModule(new Period());
		chaseDegenPeriod.config(1, 38, 1);
		this.period.onChangeSetModuleStages(chaseDegenPeriod, Period.Stages.STOP, Period.Stages.STOP, Period.Stages.STOP, Period.Stages.LOOP);

		let chaseDegenTarget = this.addModule(new Position());
		chaseDegenTarget.config();
		chaseDegenPeriod.onChangeSetModuleStages(chaseDegenTarget, Position.Stages.ACTIVE, Position.Stages.INACTIVE, Position.Stages.INACTIVE);

		let chaseDegen = this.addModule(new AreaDegenLayer());
		chaseDegen.config(chaseDegenTarget, .1, 200, .2);
		chaseDegenPeriod.onChangeSetModuleStages(chaseDegen, AreaDegenLayer.Stages.INACTIVE, AreaDegenLayer.Stages.WARNING, AreaDegenLayer.Stages.ACTIVE);
	}
}

export default MechanicalBoss;
