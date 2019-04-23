const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const WShip = require('../../graphics/WShip');
const Phase = require('../../util/Phase');
const Distance = require('../module/Distance');
const Chase = require('../module/Chase');
const Shotgun = require('../module/Shotgun');
const NearbyDegen = require('../module/NearbyDegen');
const Dash = require('../module/Dash');
// const Boomerang = require('../module/Boomerang');

const Phases = makeEnum('ONE');

class Champion extends Monster {
	constructor(x, y) {
		super(x, y, .05, .05, 1);
		this.setGraphics(new WShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let dash = new Dash();
		dash.setStagesMapping({
			[Phases.ONE]: Dash.Stages.ACTIVE,
		});
		dash.config(this, 25, .2, 25, 10, .03);
		this.moduleManager.addModule(dash);

		let dashAttackOrigin = new NearbyDegen();
		dashAttackOrigin.setStagesMapping({
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.DASHING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.COMPLETED]: NearbyDegen.Stages.ACTIVE,
			[Dash.Phases.COLLIDED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(dashAttackOrigin);
		dashAttackOrigin.config(this, .1, .1);

		let dashAttackTarget = new NearbyDegen();
		dashAttackTarget.setStagesMapping({
			[Dash.Phases.AIMING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.WARNING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.DASHING]: NearbyDegen.Stages.WARNING,
			[Dash.Phases.COMPLETED]: NearbyDegen.Stages.ACTIVE,
			[Dash.Phases.COLLIDED]: NearbyDegen.Stages.ACTIVE,
		});
		dash.addModule(dashAttackTarget);
		dashAttackTarget.config(dash.target, .1, .1);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Champion;
