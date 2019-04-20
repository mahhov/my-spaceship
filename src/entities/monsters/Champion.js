const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const Phase = require('../../util/Phase');
const Distance = require('../module/Distance');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const AShip = require('../../graphics/AShip');

const Phases = makeEnum('ONE');

class Champion extends Monster {
	constructor(x, y, damageMultiplier = 1) {
		super(x, y, .02, .02, .003);
		this.setGraphics(new AShip(this.width, this.height, {color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.setStagesMapping({[Phases.ONE]: Distance.Stages.ACTIVE});
		distance.config(this, .07, .15, 1);
		this.moduleManager.addModule(distance);

		let chase = new Chase();
		chase.setStagesMapping({
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.ACTIVE,
			3: Chase.Stages.INACTIVE
		});
		chase.config(this, .005);
		distance.addModule(chase);

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.ACTIVE,
			2: Shotgun.Stages.INACTIVE,
			3: Shotgun.Stages.INACTIVE
		});
		shotgun.config(this, .15, 1, .018, .005, 100, damageMultiplier * .005);
		distance.addModule(shotgun);

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Champion;
