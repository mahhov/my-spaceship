class Module {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStage(stage) {
		if (stage !== undefined)
			this.stage = stage
	}

	apply(map, intersectionFinder, target) {
		this.apply_(map, intersectionFinder, target);
	}

	apply_(map, intersectionFinder, target) {
		console.error('Module.apply_ has not been overwritten.');
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;
