import PolledEmitter from '../../util/PolledEmitter.js';

class Module extends PolledEmitter {
	constructor(...args) {
		super();
		this.stage = 0;
		this.onChangeModuleTuples = [];
		this.config(...args);
	}

	config() {
	}

	onChangeSetModuleStages(module, ...stages) {
		if (!this.onChangeModuleTuples.length)
			this.on('change', value => this.onChangeModuleTuples
				.filter(({stages}) => stages[value] !== null && stages[value] !== undefined)
				.forEach(({module, stages}) => module.setStage(stages[value])));
		this.onChangeModuleTuples.push({module, stages});
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
