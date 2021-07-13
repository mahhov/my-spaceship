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

		distance.onChangeSetModuleStages(
			[chaseAim, Aim.Stages.REVERSE, Aim.Stages.INACTIVE, Aim.Stages.ACTIVE, Aim.Stages.INACTIVE],
			[chase, Chase.Stages.ACTIVE, Chase.Stages.INACTIVE, Chase.Stages.ACTIVE, Chase.Stages.INACTIVE],
			[cooldown, Cooldown.Stages.ACTIVE, Cooldown.Stages.ACTIVE, Cooldown.Stages.COOLDOWN, Cooldown.Stages.COOLDOWN],
		);

		let shotgunAim = this.addModule(new Aim());
		shotgunAim.config(this);

		let shotgun = this.addModule(new Shotgun());
		shotgun.config(this, 1, 1, .01, .001, 100, 6, shotgunAim);

		cooldown.on('trigger', () => {
			shotgunAim.setStage(Aim.Stages.ACTIVE);
			shotgun.setStage(Shotgun.Stages.ACTIVE);
		});
		cooldown.on('post-trigger', () => {
			shotgunAim.setStage(Aim.Stages.INACTIVE);
			shotgun.setStage(Shotgun.Stages.INACTIVE);
		});
	}
}

export default SniperTick;
