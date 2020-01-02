const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const {Colors} = require('../../util/Constants');
const StarShip = require('../../graphics/StarShip');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');

const Phases = makeEnum('REST', 'ATTACK');

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, 4);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Colors.Entity.MONSTER.get()}));

		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setRandomTick();

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(this, .4, .001);
		this.moduleManager.addModule(nearbyDegen, {
			[Phases.REST]: NearbyDegen.Stages.INACTIVE,
			[Phases.ATTACK]: NearbyDegen.Stages.ACTIVE
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}
}

module.exports = Turret;
