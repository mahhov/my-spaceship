import PolledEmitter from '../../util/PolledEmitter.js';

class Module extends PolledEmitter {
	constructor() {
		super();
		this.stage = 0;
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
