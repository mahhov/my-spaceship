import AShip from '../../graphics/AShip.js';
import MaterialDrop from '../../playerData/MaterialDrop.js';
import {Colors} from '../../util/constants.js';
import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Vector from '../../util/Vector.js';
import Aim from '../modulesDeprecated/Aim.js';
import Chase from '../modulesDeprecated/Chase.js';
import Distance from '../modulesDeprecated/Distance.js';
import Shotgun from '../modulesDeprecated/Shotgun.js';
import MonsterDeprecated from './MonsterDeprecated.js';

const Phases = makeEnum({ONE: 0});

class MeleeDart extends MonsterDeprecated {
	constructor(x, y, damageMultiplier) {
		super(x, y, .02, .02, 30, 0, new MaterialDrop(1, false));
		this.setGraphics(new AShip(this.width, this.height, {color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .07, .15, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let chaseAim = new Aim();
		chaseAim.config(this, 0, 0, 0, Vector.fromRand(1, 1));
		distance.addModule(chaseAim, {
			0: Aim.Stages.INACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.ACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .005, chaseAim);
		distance.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.ACTIVE,
			3: Chase.Stages.INACTIVE,
		});

		let shotgunAim = new Aim();
		chaseAim.config(this);
		distance.addModule(chaseAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let shotgun = new Shotgun();
		shotgun.config(this, .07, 1, .005, .005, 50, damageMultiplier * .005, chaseAim);
		distance.addModule(shotgun, {
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.ACTIVE,
			2: Shotgun.Stages.INACTIVE,
			3: Shotgun.Stages.INACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

export default MeleeDart;
