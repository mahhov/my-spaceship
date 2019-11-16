const makeEnum = require('../../../util/Enum');
const Monster = require('.././Monster');
const {Colors} = require('../../../util/Constants');
const Rect4DotsShip = require('../../../graphics/Rect4DotsShip');
const Phase = require('../../../util/Phase');
const Period = require('../../module/Period');
const Shotgun = require('../../module/Shotgun');

const Phases = makeEnum('ONE');

class Static4DirTurret extends Monster {
	constructor(x, y) {
		super(x, y, .09, .09, 1.6);
		this.setGraphics(new Rect4DotsShip(this.width, this.height, Colors.Entity.MONSTER.get()));

		this.attackPhase = new Phase(0);

		let period = new Period();
		period.config(120, 80);
		this.moduleManager.addModule(period, {[Phases.ONE]: Period.Stages.LOOP});

		[
			{x: 1, y: 0},
			{x: 0, y: 1},
			{x: -1, y: 0},
			{x: 0, y: -1},
		].forEach(dir => {
			let shotgun = new Shotgun();
			shotgun.config(this, .05, 1, .003, .0001, 100, .02, true, 0.02, dir);
			period.addModule(shotgun, {
				0: Shotgun.Stages.INACTIVE,
				1: Shotgun.Stages.ACTIVE,
			});
		});

		this.moduleManager.modulesSetStage(this.attackPhase.get());
	}

	update(map, intersectionFinder, monsterKnowledge) {
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}
}

module.exports = Static4DirTurret;
