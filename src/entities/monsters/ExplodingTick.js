const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const DiamondShip = require('../../graphics/DiamondShip');
const Phase = require('../../util/Phase');
const Distance = require('../module/Distance');
const Chase = require('../module/Chase');
const Period = require('../module/Period');
const NearbyDegen = require('../module/NearbyDegen');

const Phases = makeEnum('ONE');

class ExplodingTick extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .4);
		this.setGraphics(new DiamondShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(0);

		let distance = new Distance();
		distance.config(this, .25, .55); // todo config distances
		this.moduleManager.addModule(distance, {[Phases.ONE]: Distance.Stages.ACTIVE});

		let period = new Period();
		period.config(1, 60, 60, 60, 1); // todo config periods
		distance.addModule(period, {
			0: Period.Stages.LOOP,
			1: Period.Stages.PLAY,
			2: Period.Stages.STOP, // todo, don't chase move when too far away
		});

		let chase = new Chase();
		chase.config(this, .003);
		period.addModule(chase, {
			0: Chase.Stages.INACTIVE,
			1: Chase.Stages.INACTIVE,
			2: Chase.Stages.INACTIVE,
			3: Chase.Stages.INACTIVE,
			4: Chase.Stages.ACTIVE,
		});

		let degen = new NearbyDegen();
		degen.config(this, .05, 3, .01, .003, 50, .005); // todo config degen
		period.addModule(degen, {
			0: NearbyDegen.Stages.INACTIVE,
			1: NearbyDegen.Stages.WARNING,
			2: NearbyDegen.Stages.ACTIVE,
			3: NearbyDegen.Stages.INACTIVE,
			4: NearbyDegen.Stages.INACTIVE,
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
