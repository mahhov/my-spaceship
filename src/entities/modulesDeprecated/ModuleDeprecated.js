class ModuleDeprecated {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStage(stage) {
		if (stage !== undefined)
			this.stage = stage;
	}

	apply(map, intersectionFinder, target) {
		this.apply_(map, intersectionFinder, target);
	}

	apply_(map, intersectionFinder, target) {
	}

	paint(painter, canvas) {
	}
}

export default ModuleDeprecated;
