const Module = require('./Module');

class ModuleManager extends Module {
	constructor() {
		super();
		this.modules = [];
	}

	addModule(module) {
		this.modules.push(module);
	}

	modulesSetStage(stage) {
		this.modules.forEach(module =>
			module.setStage(stage));
	}

	modulesApply(map, intersectionFinder, player) {
		this.modules.forEach(module =>
			module.apply(map, intersectionFinder, player));
	}

	modulesPaint(painter, camera) {
		this.modules.forEach(module =>
			module.paint(painter, camera));
	}
}

module.exports = ModuleManager;
