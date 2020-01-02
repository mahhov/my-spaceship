const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Period = require('../../module/Period');
const Rotate = require('../../module/Rotate');
const Aim = require('../../module/Aim');
const StaticLaser = require('../../module/StaticLaser');

const Phases = makeEnum('ONE');

class AimingLaserTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 1.6);
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
		staticLaser.config(this, .005, .5, aim, 50, .005);
		period.addModule(staticLaser, {
			0: StaticLaser.Stages.INACTIVE,
			1: StaticLaser.Stages.INACTIVE,
			2: StaticLaser.Stages.WARNING,
			3: StaticLaser.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

module.exports = AimingLaserTurret;
