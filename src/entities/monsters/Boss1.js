const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {UiCs, UiPs} = require('../../util/UiConstants');
const Phase = require('../../util/Phase');
const Engage = require('../module/Engage');
const PhaseSetter = require('../module/PhaseSetter');
const Restore = require('../module/Restore');
const NearbyDegen = require('../module/NearbyDegen');
const Shotgun = require('../module/Shotgun');
const StarShip = require('../../graphics/StarShip');
const Bar = require('../../painter/Bar');

const Phases = makeEnum('INACTIVE', 'PRE_DEGEN', 'DEGEN', 'PROJECTILE');

class Boss1 extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .5);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: UiCs.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0, 100, 100, 200);
		this.attackPhase.setSequentialStartPhase(Phases.PRE_DEGEN);
		this.enragePhase = new Phase(6000);
		this.enragePhase.setPhase(0);

		let engage = new Engage();
		engage.setStagesMapping({
			[Phases.INACTIVE]: Engage.Stages.ACTIVE,
			[Phases.PRE_DEGEN]: Engage.Stages.ACTIVE,
			[Phases.DEGEN]: Engage.Stages.ACTIVE,
			[Phases.PROJECTILE]: Engage.Stages.ACTIVE
		});
		engage.config(this, .5, 1);
		this.moduleManager.addModule(engage);

		let phaseSetterEngageAttack = new PhaseSetter();
		phaseSetterEngageAttack.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.TRIGGER,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.INACTIVE
		}));
		phaseSetterEngageAttack.config(this.attackPhase, Phases.PRE_DEGEN);
		engage.addModule(phaseSetterEngageAttack);

		let phaseSetterEngageEnrage = new PhaseSetter();
		phaseSetterEngageEnrage.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.TRIGGER,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.INACTIVE
		}));
		phaseSetterEngageEnrage.config(this.enragePhase, 0);
		engage.addModule(phaseSetterEngageEnrage);

		let phaseSetterDisengageAttack = new PhaseSetter();
		phaseSetterDisengageAttack.setStagesMapping(({
			[Engage.Phases.ENGAGED]: PhaseSetter.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: PhaseSetter.Stages.TRIGGER
		}));
		phaseSetterDisengageAttack.config(this.attackPhase, Phases.INACTIVE);
		engage.addModule(phaseSetterDisengageAttack);

		let restore = new Restore();
		restore.setStagesMapping(({
			[Engage.Phases.ENGAGED]: Restore.Stages.INACTIVE,
			[Engage.Phases.DISENGAGED]: Restore.Stages.TRIGGER
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

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
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
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}

	paintUi(painter, camera) {
		if (this.attackPhase.get() === Phases.INACTIVE)
			return;

		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.health.getRatio(),
			UiCs.LIFE.getShade(), UiCs.LIFE.get(), UiCs.LIFE.getShade()));
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN * 2.5, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT * .5, this.enragePhase.getRatio(),
			UiCs.ENRAGE.getShade(), UiCs.ENRAGE.get(), UiCs.ENRAGE.getShade()));
	}
}

module.exports = Boss1;
