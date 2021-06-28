import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

class UiSection extends UiComponent {
	constructor(coordinate, text) {
		super(coordinate);
		this.text = text;
	}

	static getTextCoordinate(coordinate) {
		return coordinate.clone
			.shift(0, -1)
			.move(0, -Positions.BREAK)
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.END);
	}

	paint(painter) {
		let colorOption = {color: Colors.Interface.DULL_BORDER.get()};
		painter.add(new RoundedRect(this.coordinate).setOptions(colorOption));
		painter.add(new Text(UiSection.getTextCoordinate(this.coordinate), this.text).setOptions(colorOption));
	}
}

export default UiSection;
