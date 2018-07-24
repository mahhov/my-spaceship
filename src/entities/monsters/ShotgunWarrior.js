const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const Shotgun = require('../module/Shotgun');
const Chase = require('../module/Chase');
const WShip = require('../../graphics/WShip');
const {UiCs} = require('../../UiConstants');
const BarC = require('../../painter/BarC');

const MOVE_PHASE = 0, ATTACK_PHASE = 1;

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .004, .04, Color.fromHex(0x9, 0x0, 0x4, true));
		this.attackPhase = new Phase(300, 300);
		this.attackPhase.setRandomTick();

		let shotgun = new Shotgun();
		shotgun.setStagesMapping({[MOVE_PHASE]: Shotgun.Stages.INACTIVE, [ATTACK_PHASE]: Shotgun.Stages.ACTIVE});
		shotgun.config(.1, 10, .015, .003, 100, .005, this); // todo tone down config
		this.addModule(shotgun);

		let chase = new Chase();
		chase.setStagesMapping({[MOVE_PHASE]: Chase.Stages.ACTIVE, [ATTACK_PHASE]: Chase.Stages.INACTIVE});
		chase.config(0, 100, .01, this);
		this.addModule(chase);

		this.modulesSetStage(this.attackPhase.get());

		this.ship = new WShip(this.width, this.height, {fill: true, color: this.color.get()});
		// todo ship orientation
	}

	update(logic, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.modulesSetStage(this.attackPhase.get());
		this.modulesApply(logic, intersectionFinder, player);
	}

	paint(painter, camera) {
		this.ship.paint(painter, camera, this.x, this.y, [0, 1]);
		this.modulesPaint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.getHealthRatio(),
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
		// todo extract health bar painting logic and share with other monsters
	}
}

module.exports = Turret;
