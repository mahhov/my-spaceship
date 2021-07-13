import PolledEmitter from '../../util/PolledEmitter.js';

class Module extends PolledEmitter {
	constructor() {
		super();
		this.stage = 0;
	}

	onChangeSetModuleStages(...moduleTuples) {
		this.on('change', value => moduleTuples.forEach(([module, ...stages]) => {
			if (stages[value] !== null)
				module.setStage(stages[value]);
		}));
	}

	setStage(stage) {
		this.stage = stage;
	}

	apply(map, intersectionFinder, target) {
	}

	paint(painter, canvas) {
	}
}

export default Module;
