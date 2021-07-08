import MultilineText from '../../painter/elements/MultilineText.js';
import Emitter from '../../util/Emitter.js';

class UiComponent extends Emitter {
	constructor(coordinate) {
		super();
		if (coordinate?.owner_)
			console.warn('coordinate shared among UiComponents');
		if (coordinate)
			coordinate.owner_ = this;
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

	static textWidth(textLength) {
		// todo [low] avoid using magic number 1000
		return textLength * MultilineText.measureText('14px').width / 1000;
	}
}

export default UiComponent;
