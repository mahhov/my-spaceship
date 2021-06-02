import Text from '../../painter/elements/Text.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

class UiText extends UiComponent {
	constructor(x, y, text) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
	}

	paint(painter) {
		painter.add(new Text(new Coordinate(this.x, this.y).align(Coordinate.Aligns.CENTER), this.text));
	}
}

export default UiText;
