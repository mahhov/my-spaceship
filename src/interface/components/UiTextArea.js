import MultilineText from '../../painter/elements/MultilineText.js';
import Rect from '../../painter/elements/Rect.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

class UiTextArea extends UiComponent {
	constructor(left, top, width, height, text, size = '18px') {
		super();
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		this.text = text;
		this.size = size;
	}

	paint(painter) {
		let coordinate = new Coordinate(this.left, this.top, this.width, this.height);
		painter.add(new Rect(coordinate));
		painter.add(new MultilineText(coordinate.clone.pad(.01), this.text, {size: this.size}));
	}
}

export default UiTextArea;
