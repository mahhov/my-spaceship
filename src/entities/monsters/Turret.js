const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');
const StarShip = require('../../graphics/StarShip');

const Phases = makeEnum('REST', 'ATTACK');

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setRandomTick();

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.setStagesMapping({
			[Phases.REST]: NearbyDegen.Stages.INACTIVE,
			[Phases.ATTACK]: NearbyDegen.Stages.ACTIVE
		});
		nearbyDegen.config(this, .4, .001);
		this.moduleManager.addModule(nearbyDegen);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Turret;
