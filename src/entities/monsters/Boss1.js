const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors, Positions} = require('../../util/Constants');
const Phase = require('../../util/Phase');
const StarShip = require('../../graphics/StarShip');
const Engage = require('../module/Engage');
const Trigger = require('../module/Trigger');
const PhaseSetter = require('../module/PhaseSetter');
const Restore = require('../module/Restore');
const NearbyDegen = require('../module/NearbyDegen');
const Shotgun = require('../module/Shotgun');
const Bar = require('../../painter/Bar');

const Phases = makeEnum('INACTIVE', 'PRE_DEGEN', 'DEGEN', 'PROJECTILE');

class Boss1 extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .4);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0, 100, 100, 200);
		this.attackPhase.setSequentialStartPhase(Phases.PRE_DEGEN);
		this.enragePhase = new Phase(4800);

		// engage will track when the boss is engaged or disengaged
		let engage = new Engage();
		engage.setStagesMapping({
			[Phases.INACTIVE]: Engage.Stages.ACTIVE,
			[Phases.PRE_DEGEN]: Engage.Stages.ACTIVE,
			[Phases.DEGEN]: Engage.Stages.ACTIVE,
			[Phases.PROJECTILE]: Engage.Stages.ACTIVE
		});
		engage.config(this, .5, 1);
		this.moduleManager.addModule(engage);

		// triggers when boss engages
		let engageTrigger = new Trigger();
		engageTrigger.setStagesMapping(({
			[Engage.Phases.ENGAGED]: Trigger.Stages.TRIGGER,
			[Engage.Phases.DISENGAGED]: Trigger.Stages.INACTIVE
		}));
		engage.addModule(engageTrigger);

		// when boss engages, will reset attackPhase to PRE_DEGEN
		let phaseSetterEngageAttack = new PhaseSetter();
		phaseSetterEngageAttack.setStagesMapping(({
			[Trigger.Phases.UNTRIGGERED]: PhaseSetter.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: PhaseSetter.Stages.ACTIVE
		}));
		phaseSetterEngageAttack.config(this.attackPhase, Phases.PRE_DEGEN);
		engageTrigger.addModule(phaseSetterEngageAttack);

		// when boss engages, will reset enrage
		let phaseSetterEngageEnrage = new PhaseSetter();
		phaseSetterEngageEnrage.setStagesMapping(({
			[Trigger.Phases.UNTRIGGERED]: PhaseSetter.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: PhaseSetter.Stages.ACTIVE
		}));
		phaseSetterEngageEnrage.config(this.enragePhase, 0);
		engageTrigger.addModule(phaseSetterEngageEnrage);

		// when boss disengages, will stop attacking
		let phaseSetterDisengageAttack = new PhaseSetter();
		phaseSetterDisengageAttack.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.ACTIVE
		}));
		phaseSetterDisengageAttack.config(this.attackPhase, Phases.INACTIVE);
		engage.addModule(phaseSetterDisengageAttack);

		let restore = new Restore();
		restore.setStagesMapping(({
			[Engage.Phases.ENGAGED]: Restore.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: Restore.Stages.ACTIVE
		}));
		restore.config(this);
		engage.addModule(restore);

		this.nearbyDegen = new NearbyDegen();
		this.nearbyDegen.setStagesMapping({
			[Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: NearbyDegen.Stages.WARNING,
			[Phases.DEGEN]: NearbyDegen.Stages.ACTIVE,
			[Phases.PROJECTILE]: NearbyDegen.Stages.INACTIVE
		});
		this.moduleManager.addModule(this.nearbyDegen);

		this.shotgun = new Shotgun();
		this.shotgun.setStagesMapping({
			[Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Phases.PRE_DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.PROJECTILE]: Shotgun.Stages.ACTIVE
		});
		this.moduleManager.addModule(this.shotgun);

		engage.modulesSetStage(Engage.Phases.DISENGAGED);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.get() !== Phases.INACTIVE) {
			if (this.attackPhase.sequentialTick())
				this.moduleManager.modulesSetStage(this.attackPhase.get());

			if (this.enragePhase.isNew()) {
				this.nearbyDegen.config(this, .33, .002);
				this.shotgun.config(this, .1, 10, .015, .003, 100, .005);
			}

			if (this.enragePhase.tick()) {
				this.nearbyDegen.config(this, .33, .01);
				this.shotgun.config(this, .1, 30, .018, .006, 100, .005);
			}
		}

		if (this.attackPhase.isNew())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}

	paintUi(painter, camera) {
		if (this.attackPhase.get() === Phases.INACTIVE)
			return;

		painter.add(new Bar(
			Positions.MARGIN, Positions.MARGIN, 1 - Positions.MARGIN * 2, Positions.BAR_HEIGHT, this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.getShade(Colors.BAR_SHADING)));
		painter.add(new Bar(
			Positions.MARGIN, Positions.MARGIN * 2.5, 1 - Positions.MARGIN * 2, Positions.BAR_HEIGHT * .5, this.enragePhase.getRatio(),
			Colors.ENRAGE.getShade(), Colors.ENRAGE.get(), Colors.ENRAGE.getShade()));
	}
}

module.exports = Boss1;
