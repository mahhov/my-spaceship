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
	constructor(x, y, spawnDamageMultiplier) {
		super(x, y, .04, .04, 2);
		this.setStats({armor: 2});
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 0);
		this.attackPhase.setSequentialStartPhase(Phases.ACTIVE);

		let spawn = new Spawn();
		spawn.config(this, .2, .005, 1, 4, 4, 4, MeleeDart, spawnDamageMultiplier);
		this.moduleManager.addModule(spawn, {
			[Phases.DORMANT]: Spawn.Stages.INACTIVE,
			[Phases.ACTIVE]: Spawn.Stages.ACTIVE,
		});

		let statSetter = new StatSetter();
		statSetter.config(this, {armor: .5});
		spawn.addModule(statSetter, {
			[Spawn.Phases.NOT_SPAWNING]: StatSetter.Stages.INACTIVE,
			[Spawn.Phases.SPAWNING]: StatSetter.Stages.INACTIVE,
			[Spawn.Phases.COMPLETE]: StatSetter.Stages.ACTIVE,
		});

		let rotate = new Rotate();
		rotate.config(this);
		spawn.addModule(rotate, {
			[Spawn.Phases.NOT_SPAWNING]: Rotate.Stages.INACTIVE,
			[Spawn.Phases.SPAWNING]: Rotate.Stages.ACTIVE,
			[Spawn.Phases.COMPLETE]: Rotate.Stages.INACTIVE,
		});

		spawn.modulesSetStage(Spawn.Phases.NOT_SPAWNING);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = OutpostPortal;
