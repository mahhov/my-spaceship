const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const DiamondShip = require('../../../graphics/DiamondShip');
const Phase = require('../../../util/Phase');
const {PI} = require('../../../util/Number');
const Distance = require('../../module/Distance');
const Aim = require('../../module/Aim');
const PatternedPeriod = require('../../module/PatternedPeriod');
const Chase = require('../../module/Chase');
const NearbyDegen = require('../../module/NearbyDegen');

const Phases = makeEnum('ONE');

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .6);
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .1, 1);
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let patternedPeriod = new PatternedPeriod();
		patternedPeriod.config([0, 60, 60, 60], [[0], [1, 2, 3], [3]], [false, false, true]);
		distance.addModule(patternedPeriod, {
			0: [PatternedPeriod.PrimaryStages.LOOP, 1],
			1: [PatternedPeriod.PrimaryStages.PLAY, 2],
			2: [PatternedPeriod.PrimaryStages.STOP],
		});

		let aim = new Aim();
		aim.config(this, PI / 20, 50, .1);
		patternedPeriod.addModule(aim, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.ACTIVE,
		});

		let chase = new Chase();
		chase.config(this, .003, aim);
		patternedPeriod.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.ACTIVE,
		});

		let degen = new NearbyDegen();
		degen.config(this, .1, .003);
		patternedPeriod.addModule(degen, {
			0: NearbyDegen.Stages.INACTIVE,
			1: NearbyDegen.Stages.WARNING,
			2: NearbyDegen.Stages.ACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
		});

		distance.modulesSetStage(0);
		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = ExplodingTick;
