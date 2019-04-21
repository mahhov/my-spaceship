const Module = require('./Module');

class ModuleManager extends Module {
	constructor() {
		super();
		this.modules = [];
		this.phase = -1;
	}

	addModule(module) {
		this.modules.push(module);
	}

	// todo [high] rename to setPhase
	modulesSetStage(phase) {
		if (phase === this.phase)
			return;
		this.phase = phase;
		this.modules.forEach(module =>
			module.setStage(phase));
	}

	apply(map, intersectionFinder, target) {
		this.managerApply(map, intersectionFinder, target);
		this.modulesApply(map, intersectionFinder, target);
	}

	modulesApply(map, intersectionFinder, target) {
		this.modules.forEach(module =>
			module.apply(map, intersectionFinder, target));
	}

	modulesPaint(painter, camera) {
		this.modules.forEach(module =>
			module.paint(painter, camera));
	}
}

module.exports = ModuleManager;

// todo [low] consider merging moduleManager and module
