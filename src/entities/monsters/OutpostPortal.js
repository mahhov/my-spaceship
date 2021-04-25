import makeEnum from '../../util/Enum.js';
import Monster from './Monster.js';
import {Colors} from '../../util/Constants.js';
import Buff from '../buff.js';
import OutpostPortalGraphic from '../../graphics/OutpostPortalGraphic.js';
import Phase from '../../util/Phase.js';
import Spawn from '../modules/Spawn.js';
import BuffSetter from '../modules/BuffSetter.js';
import Rotate from '../modules/Rotate.js';
import MeleeDart from './MeleeDart.js';

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
}

export default OutpostPortal;
