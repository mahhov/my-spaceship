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
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.getHealthRatio(),
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
	}
}

module.exports = Monster;
