import OutpostPortalGraphic from '../../graphics/OutpostPortalGraphic.js';
import MaterialDrop from '../../playerData/MaterialDrop.js';
import Stat from '../../playerData/Stat.js';
import {Colors} from '../../util/constants.js';
import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Buff from '../buff.js';
import BuffSetter from '../modulesDeprecated/BuffSetter.js';
import Rotate from '../modulesDeprecated/Rotate.js';
import Spawn from '../modulesDeprecated/Spawn.js';
import MeleeDart from './MeleeDart.js';
import MonsterDeprecated from './MonsterDeprecated.js';

const Phases = makeEnum({DORMANT: 0, ACTIVE: 0});

class OutpostPortal extends MonsterDeprecated {
	constructor(x, y, spawnDamageMultiplier) {
		super(x, y, .04, .04, 100, 0, new MaterialDrop(1, false));
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
		armorBuff.addStatValue(Stat.Ids.ARMOR, 3);
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
}

export default OutpostPortal;
