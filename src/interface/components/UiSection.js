import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

class UiSection extends UiComponent {
	constructor(coordinate, text, border = true) {
		super(coordinate);
		this.text = text;
		this.border = border;
	}

	paint(painter) {
		if (this.border)
			painter.add(new RoundedRect(this.coordinate).setOptions({color: Colors.Interface.DULL_BORDER.get()}));
		painter.add(new Text(this.coordinate.clone.move(0, -1).alignWithoutMove(Coordinate.Aligns.CENTER, Coordinate.Aligns.END), this.text).setOptions(this.textOptions));
	}
}

export default UiSection;
