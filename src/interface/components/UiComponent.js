import MultilineText from '../../painter/elements/MultilineText.js';
import {Positions} from '../../util/constants.js';
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

	static textWidth(textLength, size = Positions.UI_DEFAULT_FONT_SIZE) {
		// todo [low] avoid using magic number 1000
		return textLength * MultilineText.measureText(size).width / 1000;
	}
}

export default UiComponent;
