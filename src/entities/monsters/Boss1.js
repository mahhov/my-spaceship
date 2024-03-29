import RotatingTurretShip from '../../graphics/RotatingTurretShip.js';
import Bar from '../../painter/elements/Bar.js';
import MaterialDrop from '../../playerData/MaterialDrop.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import Phase from '../../util/Phase.js';
import Aim from '../modulesDeprecated/Aim.js';
import Distance from '../modulesDeprecated/Distance.js';
import LookTowards from '../modulesDeprecated/LookTowards.js';
import NearbyDegen from '../modulesDeprecated/NearbyDegen.js';
import PhaseSetter from '../modulesDeprecated/PhaseSetter.js';
import Restore from '../modulesDeprecated/Restore.js';
import Shotgun from '../modulesDeprecated/Shotgun.js';
import Trigger from '../modulesDeprecated/Trigger.js';
import MonsterDeprecated from './MonsterDeprecated.js';

const Phases = makeEnum({INACTIVE: 0, PRE_DEGEN: 0, DEGEN: 0, PROJECTILE: 0});

class Boss1 extends MonsterDeprecated {
	constructor(x, y) {
		super(x, y, .04, .04, 40, 0, new MaterialDrop(1, false));
		this.setGraphics(new RotatingTurretShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0, 100, 100, 200);
		this.attackPhase.setSequentialStartPhase(Phases.PRE_DEGEN);
		this.enragePhase = new Phase(4800);

		// distance will track when the boss is engaged or disengaged
		let distance = new Distance();
		distance.config(this, .5, 1);
		this.moduleManager.addModule(distance, {
			[Phases.INACTIVE]: Distance.Stages.ACTIVE,
			[Phases.PRE_DEGEN]: Distance.Stages.ACTIVE,
			[Phases.DEGEN]: Distance.Stages.ACTIVE,
			[Phases.PROJECTILE]: Distance.Stages.ACTIVE,
		});

		// triggers when boss engages
		let engageTrigger = new Trigger();
		distance.addModule(engageTrigger, {
			0: Trigger.Stages.TRIGGER,
			2: Trigger.Stages.INACTIVE,
		});

		// when boss engages, will reset attackPhase to PRE_DEGEN
		let phaseSetterEngageAttack = new PhaseSetter();
		phaseSetterEngageAttack.config(this.attackPhase, Phases.PRE_DEGEN);
		engageTrigger.addModule(phaseSetterEngageAttack, {
			[Trigger.Phases.UNTRIGGERED]: PhaseSetter.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: PhaseSetter.Stages.ACTIVE,
		});

		// when boss engages, will reset enrage
		let phaseSetterEngageEnrage = new PhaseSetter();
		phaseSetterEngageEnrage.config(this.enragePhase, 0);
		engageTrigger.addModule(phaseSetterEngageEnrage, {
			[Trigger.Phases.UNTRIGGERED]: PhaseSetter.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: PhaseSetter.Stages.ACTIVE,
		});

		// when boss disengages, will stop attacking
		let phaseSetterDisengageAttack = new PhaseSetter();
		phaseSetterDisengageAttack.config(this.attackPhase, Phases.INACTIVE);
		distance.addModule(phaseSetterDisengageAttack, {
			0: PhaseSetter.Stages.INACTIVE,
			2: PhaseSetter.Stages.ACTIVE,
		});

		let restore = new Restore();
		restore.config(this);
		distance.addModule(restore, {
			0: Restore.Stages.INACTIVE,
			2: Restore.Stages.ACTIVE,
		});

		this.nearbyDegen = new NearbyDegen();
		this.moduleManager.addModule(this.nearbyDegen, {
			[Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: NearbyDegen.Stages.WARNING,
			[Phases.DEGEN]: NearbyDegen.Stages.ACTIVE,
			[Phases.PROJECTILE]: NearbyDegen.Stages.INACTIVE,
		});

		this.aim = new Aim();
		this.aim.config(this);
		distance.addModule(this.aim, {
			[Phases.INACTIVE]: Aim.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: Aim.Stages.INACTIVE,
			[Phases.DEGEN]: Aim.Stages.INACTIVE,
			[Phases.PROJECTILE]: Aim.Stages.ACTIVE,
		});

		this.shotgun = new Shotgun();
		this.moduleManager.addModule(this.shotgun, {
			[Phases.INACTIVE]: Shotgun.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.PROJECTILE]: Shotgun.Stages.ACTIVE,
		});

		this.lookTowards = new LookTowards();
		this.lookTowards.config(this);
		this.moduleManager.addModule(this.lookTowards, {
			[Phases.INACTIVE]: LookTowards.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: LookTowards.Stages.INACTIVE,
			[Phases.DEGEN]: LookTowards.Stages.INACTIVE,
			[Phases.PROJECTILE]: LookTowards.Stages.ACTIVE,
		});

		distance.modulesSetStage(2);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.refresh();
		if (this.attackPhase.get() !== Phases.INACTIVE) {
			if (this.attackPhase.sequentialTick())
				this.moduleManager.modulesSetStage(this.attackPhase.get());

			if (this.enragePhase.isNew()) {
				this.nearbyDegen.config(this, .33, .002);
				this.shotgun.config(this, .1, 10, .01, .003, 50, .005, this.aim);
			}

			if (this.enragePhase.tick()) {
				this.nearbyDegen.config(this, .33, .01);
				this.shotgun.config(this, .1, 30, .012, .006, 50, .005, this.aim);
			}
		}

		if (this.attackPhase.isNew())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}

	paintUi(painter, camera) {
		if (this.attackPhase.get() === Phases.INACTIVE)
			return;
		super.paintUi(painter, camera);
		painter.add(new Bar(
			new Coordinate(
				Positions.MARGIN,
				Positions.MARGIN * 1.5 + Positions.BAR_HEIGHT,
				1 - Positions.MARGIN * 2,
				Positions.BAR_HEIGHT * .5),
			this.enragePhase.getRatio(),
			Colors.ENRAGE.getShade(), Colors.ENRAGE.get(), Colors.ENRAGE.getShade()));
	}
}

export default Boss1;
