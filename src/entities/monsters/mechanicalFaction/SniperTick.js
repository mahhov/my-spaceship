import SplitDiamondShip from '../../../graphics/SplitDiamondShip.js';
import MaterialDrop from '../../../playerData/MaterialDrop.js';
import {Colors} from '../../../util/constants.js';
import {PI} from '../../../util/number.js';
import Aim from '../../modules/Aim.js';
import Chase from '../../modules/Chase.js';
import Cooldown from '../../modules/Cooldown.js';
import Distance from '../../modules/Distance.js';
import Shotgun from '../../modules/Shotgun.js';
import Monster from '../Monster.js';

class SniperTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 60, 120, new MaterialDrop(1, false));
		this.setGraphics(new SplitDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		let distance = this.addModule(new Distance());
		distance.config(this, .5, .7, 1);
		distance.setStage(Distance.Stages.ACTIVE);

		let chaseAim = this.addModule(new Aim());
		chaseAim.config(this, PI / 20, 100, 1);

		let chase = this.addModule(new Chase());
		chase.config(this, .003, chaseAim);

		let cooldown = this.addModule(new Cooldown());
		cooldown.config(200);

		distance.on('change', segment => {
			let stages = [
				[Aim.Stages.REVERSE, Chase.Stages.ACTIVE, Cooldown.Stages.ACTIVE],
				[Aim.Stages.INACTIVE, Chase.Stages.INACTIVE, Cooldown.Stages.ACTIVE],
				[Aim.Stages.ACTIVE, Chase.Stages.ACTIVE, Cooldown.Stages.COOLDOWN],
				[Aim.Stages.INACTIVE, Chase.Stages.INACTIVE, Cooldown.Stages.COOLDOWN],
			][segment];
			chaseAim.setStage(stages[0]);
			chase.setStage(stages[1]);
			cooldown.setStage(stages[2]);
		});

		let shotgunAim = this.addModule(new Aim());
		shotgunAim.config(this);

		let shotgun = this.addModule(new Shotgun());
		shotgun.config(this, 1, 1, .01, .001, 100, 6, shotgunAim);

		cooldown.on('change', trigger => {
			shotgunAim.setStage([Aim.Stages.INACTIVE, Aim.Stages.ACTIVE][trigger]);
			shotgun.setStage([Shotgun.Stages.INACTIVE, Shotgun.Stages.ACTIVE][trigger]);
		});
	}
}

export default SniperTick;
