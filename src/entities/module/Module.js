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
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;
