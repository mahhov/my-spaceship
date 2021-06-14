import Icon from '../../painter/elements/Icon.js';
import UiButton from './UiButton.js';

class UiIconButton extends UiButton {
	constructor(coordinate, imagePath = '') {
		super(coordinate, '');
		this.imagePath = imagePath;
	}

	paint(painter) {
		if (this.hidden)
			return;
		this.paintBack(painter);
		if (this.imagePath)
			painter.add(new Icon(this.coordinate, this.imagePath));
	}
}

export default UiIconButton;
