const makeEnum = require('../../util/Enum');
const Monster = require('./Monster');
const Color = require('../../util/Color');
const Phase = require('../../util/Phase');
const NearbyDegen = require('../module/NearbyDegen');
const Shotgun = require('../module/Shotgun');
const StarShip = require('../../graphics/StarShip');
const {UiCs, UiPs} = require('../../util/UiConstants');
const Bar = require('../../painter/Bar');

const Phases = makeEnum('PRE_DEGEN', 'DEGEN', 'PROJECTILE');


class Boss1 extends Monster {
	constructor(x, y) {
		super(x, y, .04, .04, .5);
		this.setGraphics(new StarShip(this.width, this.height, {fill: true, color: Color.fromHex(0xf, 0xf, 0xf, true).get()}));

		this.attackPhase = new Phase(100, 100, 200);
		this.enragePhase = new Phase(6000);
		this.enragePhase.setPhase(0);

		this.nearbyDegen = new NearbyDegen();
		this.nearbyDegen.setStagesMapping({
			[Phases.PRE_DEGEN]: NearbyDegen.Stages.PRE,
			[Phases.DEGEN]: NearbyDegen.Stages.ACTIVE,
			[Phases.PROJECTILE]: NearbyDegen.Stages.INACTIVE
		});
		this.nearbyDegen.config(.33, .002, this);
		this.moduleManager.addModule(this.nearbyDegen);

		this.shotgun = new Shotgun();
		this.shotgun.setStagesMapping({
			[Phases.PRE_DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.DEGEN]: Shotgun.Stages.INACTIVE,
			[Phases.PROJECTILE]: Shotgun.Stages.ACTIVE
		});
		this.shotgun.config(.1, 10, .015, .003, 100, .005, this);
		this.moduleManager.addModule(this.shotgun);

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, player) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());

		if (this.enragePhase.tick()) {
			this.nearbyDegen.config(.33, .01, this);
			this.shotgun.config(.1, 30, .018, .006, 100, .005, this);
		}

		this.moduleManager.modulesApply(map, intersectionFinder, player);
	}

	paintUi(painter, camera) {
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT, this.getHealthRatio(),
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
		painter.add(new Bar(
			UiPs.MARGIN, UiPs.MARGIN * 2.5, 1 - UiPs.MARGIN * 2, UiPs.BAR_HEIGHT * .5, this.enragePhase.getRatio(),
			UiCs.ENRAGE_COLOR.getShade(), UiCs.ENRAGE_COLOR.get(), UiCs.ENRAGE_COLOR.getShade()));
	}
}

module.exports = Boss1;
