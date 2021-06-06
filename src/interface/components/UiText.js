import Text from '../../painter/elements/Text.js';
import UiComponent from './UiComponent.js';

class UiText extends UiComponent {
	constructor(coordinate, text) {
		super(coordinate);
		this.text = text;
	}

	paint(painter) {
		painter.add(new Text(this.coordinate, this.text).setOptions(this.textOptions));
	}
}

export default UiText;
