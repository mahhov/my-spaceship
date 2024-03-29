import WShip from '../../graphics/WShip.js';
import MaterialDrop from '../../playerData/MaterialDrop.js';
import {Colors} from '../../util/constants.js';
import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Aim from '../modulesDeprecated/Aim.js';
import Chase from '../modulesDeprecated/Chase.js';
import Distance from '../modulesDeprecated/Distance.js';
import Shotgun from '../modulesDeprecated/Shotgun.js';
import MonsterDeprecated from './MonsterDeprecated.js';

const Phases = makeEnum({ONE: 0});

class ShotgunWarrior extends MonsterDeprecated {
	constructor(x, y) {
		super(x, y, .04, .04, 4, 0, new MaterialDrop(1, false));
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .25, .55);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let chaseAim = new Aim();
		chaseAim.config(this);
		distance.addModule(chaseAim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, chaseAim);
		distance.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
		});

		let shotgunAim = new Aim();
		shotgunAim.config(this);
		distance.addModule(shotgunAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let shotgun = new Shotgun();
		shotgun.config(this, .05, 3, .01, .003, 50, .005, shotgunAim);
		distance.addModule(shotgun, {
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.INACTIVE,
			2: Shotgun.Stages.INACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default ShotgunWarrior;
