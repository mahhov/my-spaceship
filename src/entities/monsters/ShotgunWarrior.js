const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const Shotgun = require('../module/Shotgun');
const Chase = require('../module/Chase');
const WShip = require('../../graphics/WShip');

const MOVE_PHASE = 0, ATTACK_PHASE = 1;

class ShotgunWarrior extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Color.fromHex(0x9, 0x0, 0x4, true).get()}));

		this.attackPhase = new Phase(100, 100);
		this.attackPhase.setRandomTick();

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({[MOVE_PHASE]: Shotgun.Stages.INACTIVE, [ATTACK_PHASE]: Shotgun.Stages.ACTIVE});
		shotgun.config(.05, 3, .01, .003, 100, .005, this);
		this.moduleManager.addModule(shotgun);

		let chase = new Chase();
		chase.setStagesMapping({[MOVE_PHASE]: Chase.Stages.ACTIVE, [ATTACK_PHASE]: Chase.Stages.INACTIVE});
		chase.config(.15, .55, .003, this);
		this.moduleManager.addModule(chase);

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
