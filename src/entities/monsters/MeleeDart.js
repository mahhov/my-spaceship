const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const AShip = require('../../graphics/AShip');
const Phase = require('../../util/Phase');
const Vector = require('../../util/Vector');
const Distance = require('../module/Distance');
const Aim = require('../module/Aim');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');

const Phases = makeEnum('ONE');

class MeleeDart extends Monster {
	constructor(x, y, damageMultiplier) {
		super(x, y, .02, .02, .3);
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
			3: Aim.Stages.INACTIVE
		});

		let chase = new Chase();
		chase.config(this, .005, chaseAim);
		distance.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.ACTIVE,
			3: Chase.Stages.INACTIVE
		});

		let shotgunAim = new Aim();
		chaseAim.config(this);
		distance.addModule(chaseAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE
		});

		let shotgun = new Shotgun();
		shotgun.config(this, .07, 1, .005, .005, 50, damageMultiplier * .005, chaseAim);
		distance.addModule(shotgun, {
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.ACTIVE,
			2: Shotgun.Stages.INACTIVE,
			3: Shotgun.Stages.INACTIVE
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

module.exports = MeleeDart;
