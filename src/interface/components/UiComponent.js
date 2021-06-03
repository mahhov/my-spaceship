import Emitter from '../../util/Emitter.js';

class UiComponent extends Emitter {
	constructor() {
		super();
		// Checked in Ui iterations.
		this.visible = true;
	}


	update(controller) {
	}

	paint(painter) {
	}
}

export default UiComponent;
