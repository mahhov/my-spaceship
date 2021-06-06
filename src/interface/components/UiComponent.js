import Emitter from '../../util/Emitter.js';

class UiComponent extends Emitter {
	constructor(coordinate) {
		super();
		this.coordinate = coordinate;
		this.visible = true; // Checked in Ui iterations.
	}

	setTextOptions(textOptions) {
		this.textOptions = textOptions;
		return this;
	}

	update(controller) {
	}

	paint(painter) {
	}
}

export default UiComponent;
