const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {UiCs} = require('../../util/UiConstants');
const Phase = require('../../util/Phase');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const WShip = require('../../graphics/WShip');

const Phases = makeEnum('ONE');

class ShotgunWarrior extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: UiCs.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let chase = new Chase();
		chase.setStagesMapping({[Phases.ONE]: Chase.Stages.ACTIVE});
		chase.config(.25, .55, .003, this);
		this.moduleManager.addModule(chase);

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({
			[Chase.Phases.NEAR]: Shotgun.Stages.ACTIVE,
			[Chase.Phases.MIDDLE]: Shotgun.Stages.INACTIVE,
			[Chase.Phases.FAR]: Shotgun.Stages.INACTIVE
		});
		shotgun.config(.05, 3, .015, .003, 100, .005, this);
		chase.addModule(shotgun);

		chase.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}
}

module.exports = ShotgunWarrior;
