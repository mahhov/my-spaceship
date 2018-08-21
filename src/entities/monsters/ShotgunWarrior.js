const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const Phase = require('../../util/Phase');
const Distance = require('../module/Distance');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const WShip = require('../../graphics/WShip');

const Phases = makeEnum('ONE');

class ShotgunWarrior extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.setStagesMapping({[Phases.ONE]: Distance.Stages.ACTIVE});
		distance.config(this, .25, .55);
		this.moduleManager.addModule(distance);

		let chase = new Chase();
		chase.setStagesMapping({
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE
		});
		chase.config(this, .003);
		distance.addModule(chase);

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.INACTIVE,
			2: Shotgun.Stages.INACTIVE
		});
		shotgun.config(this, .05, 3, .015, .003, 100, .005);
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

module.exports = ShotgunWarrior;
