import Rect1DotsShip from '../../../graphics/Rect1DotsShip.js';
import {Colors} from '../../../util/constants.js';
import makeEnum from '../../../util/enum.js';
import Phase from '../../../util/Phase.js';
import Aim from '../../modules/Aim.js';
import Period from '../../modules/Period.js';
import Rotate from '../../modules/Rotate.js';
import StaticLaser from '../../modules/StaticLaser.js';
import Monster from '.././Monster.js';

const Phases = makeEnum({ONE: 0});

class AimingLaserTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 1.6, 240);
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(50, 70, 80, 1);
		period.periods.setRandomTick();
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		let rotate = new Rotate();
		rotate.config(this, 0, 0, true);
		period.addModule(rotate, {
			0: Rotate.Stages.INACTIVE,
			1: Rotate.Stages.ACTIVE,
			2: Rotate.Stages.INACTIVE,
			3: Rotate.Stages.INACTIVE,
		});

		let aim = new Aim();
		aim.config(this, 0);
		period.addModule(aim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let staticLaser = new StaticLaser();
		staticLaser.config(this, .005, .5, aim, 50, .5);
		period.addModule(staticLaser, {
			0: StaticLaser.Stages.INACTIVE,
			1: StaticLaser.Stages.INACTIVE,
			2: StaticLaser.Stages.WARNING,
			3: StaticLaser.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default AimingLaserTurret;
