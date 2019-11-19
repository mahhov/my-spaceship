const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Period = require('../module/Period');
const Aim = require('../module/Aim');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const Dash = require('../module/Dash');
const Trigger = require('../module/Trigger');
const NearbyDegen = require('../module/NearbyDegen');

const Phases = makeEnum('ONE');

class Dueler extends Monster {
	constructor(x, y) {
		super(x, y, .05, .05, 1);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(100, 25, 25, 30);
		this.moduleManager.addModule(period, {
			[Phases.ONE]: Period.Stages.LOOP,
		});

		let chaseAim = new Aim();
		chaseAim.config(this, 0, 30, 1);
		period.addModule(chaseAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .005, aim);
		period.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.INACTIVE,
		});

		let shotgunAim = new Aim();
		shotgunAim.config(this);
		period.addModule(shotgunAim, {
			0: Aim.Stages.ACTIVE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
			3: Aim.Stages.INACTIVE,
		});


		let shotgun = new Shotgun();
		shotgun.config(this, .03, 1, .01, .001, 50, .02, shotgunAim);
		period.addModule(shotgun, {
			0: Shotgun.Stages.ACTIVE,
			1: Shotgun.Stages.ACTIVE,
			2: Shotgun.Stages.INACTIVE,
			3: Shotgun.Stages.INACTIVE,
		});

		let dash = new Dash();
		dash.config(this, .4, 30);
		period.addModule(dash, {
			0: Dash.Stages.INACTIVE,
			1: Dash.Stages.AIMING,
			2: Dash.Stages.WARNING,
			3: Dash.Stages.DASHING,
		});

		let triggerDashEnd = new Trigger();
		triggerDashEnd.config(20);
		dash.addModule(triggerDashEnd, {
			[Dash.Phases.INACTIVE]: Trigger.Stages.ACTIVE,
			[Dash.Phases.AIMING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.WARNING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.DASHING]: Trigger.Stages.INACTIVE,
		});

		let dashAttackTarget = new NearbyDegen();
		dashAttackTarget.config(dash.target, .1, .002);
		triggerDashEnd.addModule(dashAttackTarget, {
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(dashAttackTarget, {
			[Dash.Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Dueler;
