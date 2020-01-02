const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const Buff = require('../buff');
const OutpostPortalGraphic = require('../../graphics/OutpostPortalGraphic');
const Phase = require('../../util/Phase');
const Spawn = require('../module/Spawn');
const BuffSetter = require('../module/BuffSetter');
const Rotate = require('../module/Rotate');
const MeleeDart = require('./MeleeDart');

const Phases = makeEnum('DORMANT', 'ACTIVE');

class OutpostPortal extends Monster {
	constructor(x, y, spawnDamageMultiplier) {
		super(x, y, .04, .04, 1);
		this.setGraphics(new OutpostPortalGraphic(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 0);
		this.attackPhase.setSequentialStartPhase(Phases.ACTIVE);

		let spawn = new Spawn();
		spawn.config(this, .2, .005, 1, 4, 4, 4, MeleeDart, spawnDamageMultiplier);
		this.moduleManager.addModule(spawn, {
			[Phases.DORMANT]: Spawn.Stages.INACTIVE,
			[Phases.ACTIVE]: Spawn.Stages.ACTIVE,
		});

		let statSetter = new BuffSetter();
		let armorBuff = new Buff(0);
		armorBuff.armor = 3;
		statSetter.config(this, armorBuff);
		spawn.addModule(statSetter, {
			[Spawn.Phases.NOT_SPAWNING]: BuffSetter.Stages.ACTIVE,
			[Spawn.Phases.SPAWNING]: BuffSetter.Stages.ACTIVE,
			[Spawn.Phases.COMPLETE]: BuffSetter.Stages.INACTIVE,
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
