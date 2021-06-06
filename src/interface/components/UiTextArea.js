import MultilineText from '../../painter/elements/MultilineText.js';
import Rect from '../../painter/elements/Rect.js';
import UiComponent from './UiComponent.js';

class UiTextArea extends UiComponent {
	constructor(coordinate, text) {
		super(coordinate);
		this.text = text;
	}

	paint(painter) {
		painter.add(new Rect(this.coordinate));
		painter.add(new MultilineText(this.coordinate.clone.pad(.01), this.text).setOptions(this.textOptions));
	}
}

export default UiTextArea;
