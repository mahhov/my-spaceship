const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const OutpostPortalGraphic = require('../../graphics/OutpostPortalGraphic');
const Phase = require('../../util/Phase');
const Spawn = require('../module/Spawn');
const StatSetter = require('../module/StatSetter');
const Rotate = require('../module/Rotate');
const MeleeDart = require('./MeleeDart');

const Phases = makeEnum('DORMANT', 'ACTIVE');

class OutpostPortal extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setStats({armor: 2});
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 0);
		this.attackPhase.setSequentialStartPhase(Phases.ACTIVE);

		let spawn = new Spawn();
		spawn.setStagesMapping({
			[Phases.DORMANT]: Spawn.Stages.INACTIVE,
			[Phases.ACTIVE]: Spawn.Stages.ACTIVE,
		});
		spawn.config(this, .2, .005, 1, 4, 10, 10, MeleeDart);
		this.moduleManager.addModule(spawn);

		let statSetter = new StatSetter();
		statSetter.setStagesMapping({
			[Spawn.Phases.NOT_SPAWNING]: StatSetter.Stages.INACTIVE,
			[Spawn.Phases.SPAWNING]: StatSetter.Stages.INACTIVE,
			[Spawn.Phases.COMPLETE]: StatSetter.Stages.ACTIVE,
		});
		statSetter.config(this, {armor: .5});
		spawn.addModule(statSetter);

		let rotate = new Rotate();
		rotate.setStagesMapping({
			[Spawn.Phases.NOT_SPAWNING]: Rotate.Stages.INACTIVE,
			[Spawn.Phases.SPAWNING]: Rotate.Stages.ACTIVE,
			[Spawn.Phases.COMPLETE]: Rotate.Stages.INACTIVE,
		});
		rotate.config(this);
		spawn.addModule(rotate);

		spawn.modulesSetStage(Spawn.Phases.NOT_SPAWNING);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = OutpostPortal;
