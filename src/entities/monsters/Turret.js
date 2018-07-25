const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');
const StarShip = require('../../graphics/StarShip');

const REST_PHASE = 0, ATTACK_PHASE = 1;

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .04);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Color.fromHex(0x9, 0x0, 0x4, true).get()}));

		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setRandomTick();

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.setStagesMapping({[REST_PHASE]: NearbyDegen.Stages.PRE, [ATTACK_PHASE]: NearbyDegen.Stages.ACTIVE});
		nearbyDegen.config(.4, .001, this);
		this.moduleManager.addModule(nearbyDegen);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}
}

module.exports = Turret;
