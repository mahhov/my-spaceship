import Rect1DotsShip from '../../../graphics/Rect1DotsShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import Vector from '../../../util/Vector.js';
import Aim from '../../modules/Aim.js';
import Distance from '../../modules/Distance.js';
import NearbyDegen from '../../modules/NearbyDegen.js';
import Period from '../../modules/Period.js';
import Shotgun from '../../modules/Shotgun.js';
import StaticLaser from '../../modules/StaticLaser.js';
import Monster from '../Monster.js';

class MechanicalBossEarly extends Monster {
	constructor(x, y) {
		super(x, y, .2, .2, 2200, 500, new MaterialDrop(1, false));
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		let distance = this.addModule(new Distance(this, .25, .75));
		distance.setStage(Distance.Stages.ACTIVE);

		let nearbyDegenPeriod = this.addModule(new Period(50, 150, 1)); // warning, active, inactive
		nearbyDegenPeriod.setStage(Period.Stages.PLAY);
		nearbyDegenPeriod.periods.setPhase(2);
		distance.onChangeSetModuleStages(nearbyDegenPeriod, Period.Stages.LOOP, Period.Stages.PLAY, Period.Stages.PLAY);

		let nearbyDegen = this.addModule(new NearbyDegen(this, .5, .2));
		nearbyDegenPeriod.onChangeSetModuleStages(nearbyDegen, NearbyDegen.Stages.WARNING, NearbyDegen.Stages.ACTIVE, NearbyDegen.Stages.INACTIVE);

		let farAwayShotgunAim = this.addModule(new Aim(this, 0));
		distance.onChangeSetModuleStages(farAwayShotgunAim, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE);

		let farAwayShotgun = this.addModule(new Shotgun(this, .1, 1, .01, 0, 200, 1, farAwayShotgunAim, true));
		distance.onChangeSetModuleStages(farAwayShotgun, Shotgun.Stages.INACTIVE, Shotgun.Stages.INACTIVE, Shotgun.Stages.ACTIVE);

		this.period = this.addModule(new Period(100, 200, 100, 200)); // rest, laser, pause, shotgun
		this.period.setStage(Period.Stages.LOOP);

		let laserPeriod = this.addModule(new Period(1, 38, 1));
		this.period.onChangeSetModuleStages(laserPeriod, Period.Stages.STOP, Period.Stages.LOOP, Period.Stages.STOP, Period.Stages.STOP);

		for (let i = 0; i < 3; i++) {
			let laserAim = this.addModule(new Aim(this, 0, 1, .1));
			laserPeriod.onChangeSetModuleStages(laserAim, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE);

			let staticLaser = this.addModule(new StaticLaser(this, .005, .5, laserAim, 40, .2, .01));
			laserPeriod.onChangeSetModuleStages(staticLaser, StaticLaser.Stages.INACTIVE, StaticLaser.Stages.WARNING, StaticLaser.Stages.ACTIVE);
		}

		[[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(xy => {
			let shotgunAim = this.addModule(new Aim(this, 0, 0, 0, new Vector(...xy)));
			this.period.onChangeSetModuleStages(shotgunAim, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE);

			let shotgun = this.addModule(new Shotgun(this, .1, 1, .005, .002, 100, 4, shotgunAim, true));
			this.period.onChangeSetModuleStages(shotgun, Shotgun.Stages.INACTIVE, Shotgun.Stages.INACTIVE, Shotgun.Stages.INACTIVE, Shotgun.Stages.ACTIVE);
		});
	}
}

export default MechanicalBossEarly;

// todo [medium] rotation
