const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const WShip = require('../../graphics/WShip');

const ONE_PHASE = 0;

class ShotgunWarrior extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Color.fromHex(0x9, 0x0, 0x4, true).get()}));

		this.attackPhase = new Phase(0);

		let chase = new Chase();
		chase.setStagesMapping({[ONE_PHASE]: Chase.Stages.ACTIVE});
		chase.config(.15, .55, .003, this);
		this.moduleManager.addModule(chase);

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({0: Shotgun.Stages.ACTIVE, 1: Shotgun.Stages.INACTIVE, 2: Shotgun.Stages.INACTIVE}); // todo x move to chase or make chase phases public
		shotgun.config(.05, 3, .01, .003, 100, .005, this); // todo x adjust range
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

// todo x smart phasing, stop movement when in range, start movmeent when out of range
