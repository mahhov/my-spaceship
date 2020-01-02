const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect1DotsShip = require('../../../graphics/Rect1DotsShip');
const Phase = require('../../../util/Phase');
const Vector = require('../../../util/Vector');
const Distance = require('../../module/Distance');
const Period = require('../../module/Period');
const NearbyDegen = require('../../module/NearbyDegen');
const Aim = require('../../module/Aim');
const Shotgun = require('../../module/Shotgun');
const StaticLaser = require('../../module/StaticLaser');

const Phases = makeEnum('ONE');

class MechanicalBossEarly extends Monster {
	constructor(x, y) {
		super(x, y, .2, .2, 22);
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.addModules();

		this.attackPhase = new Phase(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	addModules() {
		this.addParentsModule();
		this.addNearbyDegenModule();
		this.addFarAwayShotgunModule();
		this.addLaserModule();
		this.addShotgunFireModule();
	}

	addParentsModule() {
		this.distance = new Distance();
		this.distance.config(this, .25, .75);
		this.moduleManager.addModule(this.distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		this.period = new Period();
		this.period.config(100, 200, 100, 200);
		this.moduleManager.addModule(this.period, {[Phases.ONE]: Period.Stages.LOOP});
	}

	addNearbyDegenModule() {
		let nearbyDegenPeriod = new Period();
		nearbyDegenPeriod.config(50, 150, 1);
		nearbyDegenPeriod.periods.setPhase(2);
		this.distance.addModule(nearbyDegenPeriod, {
			0: Period.Stages.LOOP,
			1: Period.Stages.PLAY,
			2: Period.Stages.PLAY,
		});

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(this, .5, .002);
		nearbyDegenPeriod.addModule(nearbyDegen, {
			0: NearbyDegen.Stages.WARNING,
			1: NearbyDegen.Stages.ACTIVE,
			2: NearbyDegen.Stages.INACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
		});
	}

	addFarAwayShotgunModule() {
		let farAwayShotgunAim = new Aim();
		farAwayShotgunAim.config(this, 0);
		this.distance.addModule(farAwayShotgunAim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.ACTIVE,
		});

		let farAwayShotgun = new Shotgun();
		farAwayShotgun.config(this, .1, 1, .01, 0, 200, .01, farAwayShotgunAim, true);
		this.distance.addModule(farAwayShotgun, {
			0: Shotgun.Stages.INACTIVE,
			1: Shotgun.Stages.INACTIVE,
			2: Shotgun.Stages.ACTIVE,
		});
	}

	addLaserModule() {
		let laserPeriod = new Period();
		laserPeriod.config(1, 38, 1);
		this.period.addModule(laserPeriod, {
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

	}

	addShotgunFireModule() {
		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(xy => {
			let shotgunAim = new Aim();
			shotgunAim.config(this, 0, 0, 0, new Vector(...xy));
			this.period.addModule(shotgunAim, {
				0: Aim.Stages.INACTIVE,
				1: Aim.Stages.INACTIVE,
				2: Aim.Stages.INACTIVE,
				3: Aim.Stages.INACTIVE,
			});

			let shotgun = new Shotgun();
			shotgun.config(this, .1, 1, .005, .002, 100, .04, shotgunAim, true);
			this.period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.INACTIVE,
				2: Shotgun.Stages.INACTIVE,
				3: Shotgun.Stages.ACTIVE,
			});
		});
	}
}

module.exports = MechanicalBossEarly;

// todo [high] rotation
