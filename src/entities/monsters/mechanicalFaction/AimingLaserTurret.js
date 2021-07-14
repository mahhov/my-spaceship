import Rect1DotsShip from '../../../graphics/Rect1DotsShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import Aim from '../../modules/Aim.js';
import Period from '../../modules/Period.js';
import Rotate from '../../modules/Rotate.js';
import StaticLaser from '../../modules/StaticLaser.js';
import Monster from '../Monster.js';

class AimingLaserTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 160, 240, new MaterialDrop(1, false));
		this.setGraphics(new Rect1DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		let period = this.addModule(new Period());
		period.config(50, 70, 80, 1); // rest, aim, warn, laser
		period.periods.setRandomTick();
		period.setStage(Period.Stages.LOOP);

		let rotate = this.addModule(new Rotate());
		rotate.config(this, 0, 0, true);
		period.onChangeSetModuleStages(rotate, Rotate.Stages.INACTIVE, Rotate.Stages.ACTIVE, Rotate.Stages.INACTIVE, Rotate.Stages.INACTIVE);

		let aim = this.addModule(new Aim());
		aim.config(this, 0);
		period.onChangeSetModuleStages(aim, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE, Aim.Stages.INACTIVE);

		let staticLaser = this.addModule(new StaticLaser());
		staticLaser.config(this, .005, .5, aim, 50, .5);
		period.onChangeSetModuleStages(staticLaser, StaticLaser.Stages.INACTIVE, StaticLaser.Stages.INACTIVE, StaticLaser.Stages.WARNING, StaticLaser.Stages.ACTIVE);
	}
}

export default AimingLaserTurret;
