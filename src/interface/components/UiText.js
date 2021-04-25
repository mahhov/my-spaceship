import UiComponent from './UiComponent.js';
import Text from '../../painter/elements/Text.js';

class UiText extends UiComponent {
	constructor(x, y, text) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
	}

	paint(painter) {
		painter.add(new Text(this.x, this.y, this.text));
	}
}

export default UiText;
