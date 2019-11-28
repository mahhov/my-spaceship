const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Vector = require('../../../util/Vector');
const Period = require('../../module/Period');
const Aim = require('../../module/Aim');
const StaticLaser = require('../../module/StaticLaser');
const Position = require('../../module/Position');
const AreaDegenLayer = require('../../module/AreaDegenLayer');
const Shotgun = require('../../module/Shotgun');

const Phases = makeEnum('ONE');

class MechanicalBoss extends Monster {
	constructor(x, y) {
		super(x, y, .2, .2, 22);
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(100, 200, 100, 200);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		// laser

		let laserPeriod = new Period();
		laserPeriod.config(1, 38, 1);
		period.addModule(laserPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.LOOP,
			2: Period.Stages.STOP,
			3: Period.Stages.STOP,
		});

		for (let i = 0; i < 3; i++) {
			let laserAim = new Aim();
			laserAim.config(this, 0, 1, .1);
			laserPeriod.addModule(laserAim, {
				0: Aim.Stages.ACTIVE,
				1: Aim.Stages.INACTIVE,
				2: Aim.Stages.INACTIVE,
			});

			let staticLaser = new StaticLaser();
			staticLaser.config(this, .005, .5, laserAim, 40, .002, .01);
			laserPeriod.addModule(staticLaser, {
				0: StaticLaser.Stages.INACTIVE,
				1: StaticLaser.Stages.WARNING,
				2: StaticLaser.Stages.ACTIVE,
			});
		}

		// surround degen

		let surroundDegenPeriod = new Period();
		surroundDegenPeriod.config(1, 38, 1);
		period.addModule(surroundDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.LOOP,
			2: Period.Stages.STOP,
			3: Period.Stages.STOP,
		});

		for (let i = 0; i < 1; i++) {
			let surroundDegenTarget = new Position();
			surroundDegenTarget.config(this, .3);
			surroundDegenPeriod.addModule(surroundDegenTarget, {
				0: Position.Stages.ACTIVE,
				1: Position.Stages.INACTIVE,
				2: Position.Stages.INACTIVE,
			});

			let surroundDegen = new AreaDegenLayer();
			surroundDegen.config(surroundDegenTarget, .06, 200, .002);
			surroundDegenPeriod.addModule(surroundDegen, {
				0: AreaDegenLayer.Stages.INACTIVE,
				1: AreaDegenLayer.Stages.WARNING,
				2: AreaDegenLayer.Stages.ACTIVE,
			});
		}

		// shotgun fire

		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(xy => {
			let shotgunAim = new Aim();
			shotgunAim.config(this, 0, 0, 0, new Vector(...xy));
			period.addModule(shotgunAim, {
				0: Aim.Stages.INACTIVE,
				1: Aim.Stages.INACTIVE,
				2: Aim.Stages.INACTIVE,
				3: Aim.Stages.INACTIVE,
			});

			let shotgun = new Shotgun();
			shotgun.config(this, .1, 1, .005, .002, 100, .01, shotgunAim, true);
			period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.INACTIVE,
				2: Shotgun.Stages.INACTIVE,
				3: Shotgun.Stages.ACTIVE,
			});
		});

		// chase degen

		let chaseDegenPeriod = new Period();
		chaseDegenPeriod.config(1, 38, 1);
		period.addModule(chaseDegenPeriod, {
			0: Period.Stages.STOP,
			1: Period.Stages.STOP,
			2: Period.Stages.STOP,
			3: Period.Stages.LOOP,
		});

		for (let i = 0; i < 1; i++) {
			let chaseDegenTarget = new Position();
			chaseDegenTarget.config(null, i * .3);
			chaseDegenPeriod.addModule(chaseDegenTarget, {
				0: Position.Stages.ACTIVE,
				1: Position.Stages.INACTIVE,
				2: Position.Stages.INACTIVE,
			});

			let chaseDegen = new AreaDegenLayer();
			chaseDegen.config(chaseDegenTarget, .06, 200, .002);
			chaseDegenPeriod.addModule(chaseDegen, {
				0: AreaDegenLayer.Stages.INACTIVE,
				1: AreaDegenLayer.Stages.WARNING,
				2: AreaDegenLayer.Stages.ACTIVE,
			});
		}

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}


	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = MechanicalBoss;
