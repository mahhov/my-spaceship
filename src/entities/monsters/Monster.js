const LivingEntity = require('../LivingEntity');
const IntersectionFinder = require('../../intersection/IntersectionFinder');

class Monster extends LivingEntity {
	constructor(x, y, width, height, health, color) {
		super(x, y, width, height, health, color, IntersectionFinder.Layers.HOSTILE_UNIT);
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
}

module.exports = Monster;
