const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');
const {UiCs} = require('../../util/UiConstants');
const BarC = require('../../painter/BarC');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health) {
		super(x, y, width, height, health, IntersectionFinder.Layers.HOSTILE_UNIT);
		this.modules = [];
	}

	addModule(module) {
		this.modules.push(module);
	}

	modulesSetStage(stage) {
		this.modules.forEach(module =>
			module.setStage(stage));
	}

	modulesApply(logic, intersectionFinder, player) {
		this.modules.forEach(module =>
			module.apply(logic, intersectionFinder, player));
	}

	modulesPaint(painter, camera) {
		this.modules.forEach(module =>
			module.paint(painter, camera));
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		this.modulesPaint(painter, camera);
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .1, .01, this.getHealthRatio(),
			UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));
	}
}

module.exports = Monster;
