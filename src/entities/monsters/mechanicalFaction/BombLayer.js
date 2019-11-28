const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DoubleHorizDiamondShip = require('../../../graphics/DoubleHorizDiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const Chase = require('../../module/Chase');
const Cooldown = require('../../module/Cooldown');
const AreaDegenLayer = require('../../module/AreaDegenLayer');

const Phases = makeEnum('ONE');

class BombLayer extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 1.2);
		this.setGraphics(new DoubleHorizDiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let aim = new Aim();
		aim.config(this, PI / 80, 80, .2);
		distance.addModule(aim, {
			0: Aim.Stages.REVERSE,
			1: Aim.Stages.ACTIVE,
			2: Aim.Stages.INACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		distance.addModule(chase, {
			0: Chase.Stages.ACTIVE,
			1: Chase.Stages.ACTIVE,
			2: Chase.Stages.INACTIVE,
		});

		let cooldown = new Cooldown();
		cooldown.config(80);
		distance.addModule(cooldown, {
			0: Cooldown.Stages.ACTIVE,
			1: Cooldown.Stages.ACTIVE,
			2: Cooldown.Stages.COOLDOWN,
		});

		let areaDegen = new AreaDegenLayer();
		areaDegen.config(this, .1, 200, .003);
		cooldown.addModule(areaDegen, {
			[Cooldown.Phases.UNTRIGGERED]: AreaDegenLayer.Stages.INACTIVE,
			[Cooldown.Phases.TRIGGERED]: AreaDegenLayer.Stages.ACTIVE,
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = BombLayer;
