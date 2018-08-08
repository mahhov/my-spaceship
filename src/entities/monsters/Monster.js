const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const ModuleManager = require('../module/ModuleManager');
const {UiCs} = require('../../util/UiConstants');
const BarC = require('../../painter/BarC');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.moduleManager = new ModuleManager();
	}

	update(map, intersectionFinder, player) {
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.moduleManager.modulesPaint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.health.getRatio(),
			UiCs.LIFE.getShade(UiCs.BAR_SHADING), UiCs.LIFE.get(), UiCs.LIFE.getShade(UiCs.BAR_SHADING)));
	}
}

module.exports = Monster;
