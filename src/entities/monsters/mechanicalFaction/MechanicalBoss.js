import AreaDegenLayer from '../../modules/AreaDegenLayer.js';
import Period from '../../modules/Period.js';
import Position from '../../modules/Position.js';
import MechanicalBossEarly from './MechanicalBossEarly.js';

class MechanicalBoss extends MechanicalBossEarly {
	// todo [low] set expValue higher than MechanicalBossEarly

	constructor(x, y) {
		super(x, y);

		// this.period = pause, laser + random degen, pause, shotgun + chasing degen

		let surroundDegenPeriod = this.addModule(new Period(1, 38, 1));
		this.period.onChangeSetModuleStages(surroundDegenPeriod, Period.Stages.STOP, Period.Stages.LOOP, Period.Stages.STOP, Period.Stages.STOP);

		let surroundDegenTarget = this.addModule(new Position(this, .2, .5));
		surroundDegenPeriod.onChangeSetModuleStages(surroundDegenTarget, Position.Stages.ACTIVE, Position.Stages.INACTIVE, Position.Stages.INACTIVE);

		let surroundDegen = this.addModule(new AreaDegenLayer(surroundDegenTarget, .1, 200, .2));
		surroundDegenPeriod.onChangeSetModuleStages(surroundDegen, AreaDegenLayer.Stages.INACTIVE, AreaDegenLayer.Stages.WARNING, AreaDegenLayer.Stages.ACTIVE);

		let chaseDegenPeriod = this.addModule(new Period(1, 38, 1));
		this.period.onChangeSetModuleStages(chaseDegenPeriod, Period.Stages.STOP, Period.Stages.STOP, Period.Stages.STOP, Period.Stages.LOOP);

		let chaseDegenTarget = this.addModule(new Position());
		chaseDegenPeriod.onChangeSetModuleStages(chaseDegenTarget, Position.Stages.ACTIVE, Position.Stages.INACTIVE, Position.Stages.INACTIVE);

		let chaseDegen = this.addModule(new AreaDegenLayer(chaseDegenTarget, .1, 200, .2));
		chaseDegenPeriod.onChangeSetModuleStages(chaseDegen, AreaDegenLayer.Stages.INACTIVE, AreaDegenLayer.Stages.WARNING, AreaDegenLayer.Stages.ACTIVE);
	}
}

export default MechanicalBoss;
