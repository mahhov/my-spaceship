class AttackModule {
	constructor() {
		this.stage = 0;
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

module.exports = AttackModule;
