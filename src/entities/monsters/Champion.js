const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Cooldown = require('../module/Cooldown');
const Dash = require('../module/Dash');
const Trigger = require('../module/Trigger');
const NearbyDegen = require('../module/NearbyDegen');
// const Boomerang = require('../module/Boomerang');

const Phases = makeEnum('ONE');

class Champion extends Monster {
	constructor(x, y) {
		super(x, y, .05, .05, 1);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let cooldown = new Cooldown();
		cooldown.setStagesMapping({
			[Phases.ONE]: Cooldown.Stages.ACTIVE,
		});
		cooldown.config(300);
		this.moduleManager.addModule(cooldown);

		let dash = new Dash();
		dash.setStagesMapping({
			[Cooldown.Phases.UNTRIGGERED]: Dash.Stages.FINISH,
			[Cooldown.Phases.TRIGGERED]: Dash.Stages.ACTIVE,
		});
		dash.config(this, 25, .2, 25, 10, .03);
		cooldown.addModule(dash);

		let trigger = new Trigger();
		trigger.setStagesMapping({
			[Dash.Phases.AIMING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.WARNING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.DASHING]: Trigger.Stages.INACTIVE,
			[Dash.Phases.COMPLETED]: Trigger.Stages.TRIGGER,
		});
		trigger.config();
		dash.addModule(trigger);

		let dashAttackOrigin = new NearbyDegen();
		dashAttackOrigin.setStagesMapping({
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dashAttackOrigin.config(this, .1, .05);
		trigger.addModule(dashAttackOrigin);

		let dashAttackTarget = new NearbyDegen();
		dashAttackTarget.setStagesMapping({
			[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
			[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		});
		dashAttackTarget.config(dash.target, .1, .05);
		trigger.addModule(dashAttackTarget);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Champion;
