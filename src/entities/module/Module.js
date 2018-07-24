class Module {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStagesMapping(stagesMaps) {
		this.stagesMap = stagesMaps;
	}

	setStage(stage) {
		this.stage = this.stagesMap[stage];
	}

	apply(logic, intersectionFinder, origin, target) {
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;
