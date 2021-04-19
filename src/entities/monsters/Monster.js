const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const ModuleManager = require('../modules/ModuleManager');
const {Colors, Positions} = require('../../util/Constants');
const BarC = require('../../painter/elements/BarC');
const Bar = require('../../painter/elements/Bar');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.moduleManager = new ModuleManager();
	}

	update(map, intersectionFinder, monsterKnowledge) {
		this.refresh();
		if (this.attackPhase.sequentialTick())
			this.moduleManager.modulesSetStage(this.attackPhase.get());
		this.moduleManager.apply(map, intersectionFinder, monsterKnowledge.getPlayer());
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.moduleManager.paint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get()));
	}

	paintUi(painter, camera) {
		painter.add(new Bar(
			Positions.MARGIN,
			Positions.MARGIN,
			1 - Positions.MARGIN * 2,
			Positions.BAR_HEIGHT,
			this.health.getRatio(),
			Colors.LIFE.getShade(Colors.BAR_SHADING),
			Colors.LIFE.get(),
			Colors.LIFE.getShade(Colors.BAR_SHADING)));
	}
}

module.exports = Monster;
