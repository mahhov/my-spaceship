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
		period.config(120, 80, 1);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		let rotate = new Rotate();
		rotate.config(this, 0, 0, true);
		period.addModule(rotate, {
			0: Rotate.Stages.ACTIVE,
			1: Rotate.Stages.INACTIVE,
			2: Rotate.Stages.INACTIVE,
		});

		let aim = new Aim();
		aim.config(this, 0);
		period.addModule(aim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let staticLaser = new StaticLaser();
		staticLaser.config(this, .005, .5, aim, 50, .005);
		period.addModule(staticLaser, {
			0: StaticLaser.Stages.INACTIVE,
			1: StaticLaser.Stages.WARNING,
			2: StaticLaser.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = AimingLaserTurret;
