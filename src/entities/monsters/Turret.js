const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');
const StarShip = require('../../graphics/StarShip');
const {UiCs} = require('../../UiConstants');
const BarC = require('../../painter/BarC');

const REST_PHASE = 0, ATTACK_PHASE = 1;

class Turret extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .004, .04, Color.fromHex(0x9, 0x0, 0x4, true));
		this.attackPhase = new Phase(200, 200);
		this.attackPhase.setPhaseWithRandomTick(0);

		let nearbyDegen = new NearbyDegen();
		nearbyDegen.config(.4, .001, this);
		nearbyDegen.setStagesMapping({[REST_PHASE]: NearbyDegen.Stages.PRE, [ATTACK_PHASE]: NearbyDegen.Stages.ACTIVE});
		this.modules = [nearbyDegen]; // todo add modules system to all monst entities

		this.ship = new StarShip(this.width, this.height, {fill: true, color: this.color.get()});
	}

	update(logic, intersectionFinder, player) {
		this.attackPhase.sequentialTick();
		this.modules.forEach(module => {
			module.setStage(this.attackPhase.get());
			module.apply(logic, intersectionFinder, player);
		});
	}

	paint(painter, camera) {
		this.ship.paint(painter, camera, this.x, this.y, [0, 1]);

		this.modules.forEach(module =>
			module.paint(painter, camera));

		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.getHealthRatio(),
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
	}
}

module.exports = Turret;

// todo
// make shotgun warrior
// modularize monster
