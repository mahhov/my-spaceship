const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Period = require('../module/Period');
const Dash = require('../module/Dash');
const NearbyDegen = require('../module/NearbyDegen');
// const Boomerang = require('../module/Boomerang');

const Phases = makeEnum('ONE');

class Champion extends Monster {
	constructor(x, y) {
		super(x, y, .05, .05, 1);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(250, 25, 25, 10);
		this.moduleManager.addModule(period, {
			[Phases.ONE]: Period.Stages.PLAY,
		});

		let dash = new Dash();
		dash.config(this, 25, .2, 25, 10, .03);
		period.addModule(dash, {
			[0]: Dash.Stages.INACTIVE,
			[1]: Dash.Stages.AIMING,
			[2]: Dash.Stages.WARNING,
			[3]: Dash.Stages.DASHING,
		});

		let dashAttackOrigin = new NearbyDegen();
		dashAttackOrigin.config(this, .1, .05);
		dash.addModule(dashAttackOrigin, {
			[Dash.Phases.INACTIVE]: NearbyDegen.Stages.INACTIVE,
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.DASHING]: NearbyDegen.Stages.WARNING,
		});

		// let dashAttackTarget = new NearbyDegen();
		// dashAttackTarget.config(dash.target, .1, .05);
		// dash.addModule(dashAttackTarget, {
		// 	[Trigger.Phases.UNTRIGGERED]: NearbyDegen.Stages.INACTIVE,
		// 	[Trigger.Phases.TRIGGERED]: NearbyDegen.Stages.ACTIVE,
		// });

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Champion;
