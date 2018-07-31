class Module {
	constructor() {
		this.stage = 0;
	}

	config() {
	}

	setStagesMapping(stagesMaps) {
		this.stagesMap = stagesMaps;
	}

	setStage(phase) {
		this.stage = this.stagesMap[phase];
	}

	apply(map, intersectionFinder, origin, target) {
	}

	paint(painter, canvas) {
	}
}

module.exports = Module;
