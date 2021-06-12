import {Positions} from '../../../util/constants.js';
import Coordinate from '../../../util/Coordinate.js';
import UiGridLayout from './UiGridLayout.js';

const BOTTOM_LINE_SPACING = 1.2, ALLOCATE_BUTTON_SIZE = 0.015;

class TraitsUiLayout extends UiGridLayout {
	constructor(coordinate, columns) {
		let height = Positions.UI_LINE_HEIGHT * (1 + BOTTOM_LINE_SPACING);
		super(coordinate, columns, height);
	}

	getCoordinates(i) {
		let container = this.getContainerCoordinate(i);
		let topLine = container.clone
			.size(this.width, Positions.UI_LINE_HEIGHT)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		let bottomLine = topLine.clone.shift(0, BOTTOM_LINE_SPACING);
		let buttonLine = bottomLine.clone.pad(.01, 0);
		let buttonLeft = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);
		let buttonRight = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);
		return {container, topLine, bottomLine, buttonLeft, buttonRight};
	}
}

export default TraitsUiLayout;
