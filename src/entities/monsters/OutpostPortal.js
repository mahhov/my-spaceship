const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const OutpostPortalGraphic = require('../../graphics/OutpostPortalGraphic');
const Phase = require('../../util/Phase');
const Rotate = require('../module/Rotate');
const Spawn = require('../module/Spawn');
const MeleeDart = require('./MeleeDart');

const Phases = makeEnum('ONE');

class OutpostPortal extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let rotate = new Rotate();
		rotate.setStagesMapping({[Phases.ONE]: Rotate.Stages.ACTIVE});
		rotate.config(this);
		this.moduleManager.addModule(rotate);

		let spawn = new Spawn();
		spawn.setStagesMapping({[Phases.ONE]: Spawn.Stages.ACTIVE});
		spawn.config(this, .2, .005, 1, 4, MeleeDart);
		this.moduleManager.addModule(spawn);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = OutpostPortal;
