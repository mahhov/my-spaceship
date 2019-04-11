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

	// todo rename to setPhase
	modulesSetStage(phase) {
		if (phase === this.phase)
			return;
		this.phase = phase;
		this.modules.forEach(module =>
			module.setStage(phase));
	}

	apply(map, intersectionFinder, origin, target) {
		this.managerApply(map, intersectionFinder, origin, target);
		this.modulesApply(map, intersectionFinder, origin, target);
	}

	modulesApply(map, intersectionFinder, origin, target) {
		this.modules.forEach(module =>
			module.apply(map, intersectionFinder, origin, target));
	}

	modulesPaint(painter, camera) {
		this.modules.forEach(module =>
			module.paint(painter, camera));
	}
}

module.exports = ModuleManager;

// todo [low] consider merging moduleManager and module
