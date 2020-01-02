const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const SplitDiamondShip = require('../../../graphics/SplitDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const Chase = require('../../module/Chase');
const Cooldown = require('../../module/Cooldown');
const Shotgun = require('../../module/Shotgun');

const Phases = makeEnum('ONE');

class SniperTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .6);
		this.setGraphics(new SplitDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .5, .7, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let chaseAim = new Aim();
		chaseAim.config(this, PI / 20, 100, 1);
		distance.addModule(chaseAim, {
			0: Aim.Stages.REVERSE,
			1: Aim.Stages.INACTIVE,
			2: Aim.Stages.ACTIVE,
			3: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, chaseAim);
		distance.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.ACTIVE,
			3: Chase.Stages.INACTIVE,
		});

		let cooldown = new Cooldown();
		cooldown.config(200);
		distance.addModule(cooldown, {
			0: Cooldown.Stages.ACTIVE,
			1: Cooldown.Stages.ACTIVE,
			2: Cooldown.Stages.COOLDOWN,
			3: Cooldown.Stages.COOLDOWN,
		});

		let shotgunAim = new Aim();
		shotgunAim.config(this);
		cooldown.addModule(shotgunAim, {
			[Cooldown.Phases.UNTRIGGERED]: Shotgun.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: Shotgun.Stages.ACTIVE,
		});

		let shotgun = new Shotgun();
		shotgun.config(this, 1, 1, .01, .001, 100, .06, shotgunAim);
		cooldown.addModule(shotgun, {
			[Cooldown.Phases.UNTRIGGERED]: Shotgun.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: Shotgun.Stages.ACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

module.exports = SniperTick;
