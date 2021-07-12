import PolledEmitter from '../../util/PolledEmitter.js';

class Module2 extends PolledEmitter {
	constructor() {
		super();
		this.stage = 0;
	}

	setStage(stage) {
		// Used externally
		this.stage = stage;
	}

	apply(map, intersectionFinder, target) {
	}

	paint(painter, canvas) {
	}
}

export default Module2;
