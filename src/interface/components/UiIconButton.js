import Icon from '../../painter/elements/Icon.js';
import {Positions} from '../../util/constants.js';
import UiButton from './UiButton.js';

class UiIconButton extends UiButton {
	constructor(coordinate, imagePath = '', hotkey = '', outline = false) {
		super(coordinate, '', hotkey);
		this.imagePath = imagePath;
		this.outline = outline;
	}

	paint(painter) {
		if (this.hidden)
			return;
		this.paintBack(painter);
		if (this.outline)
			this.paintOutline(painter);
		if (this.imagePath)
			painter.add(new Icon(this.coordinate.clone.pad(Positions.BREAK), this.imagePath));
	}
}

export default UiIconButton;
