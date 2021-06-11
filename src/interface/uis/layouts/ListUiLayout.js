import Coordinate from '../../../util/Coordinate.js';
import UiGridLayout from './UiLayout.js';

class ListUiLayout extends UiGridLayout {
	constructor(coordinate, lineHeight) {
		super(coordinate, 1, lineHeight, 0, 0);
	}

	getCoordinates(i) {
		let container = this.getContainerCoordinate(i);
		let right = container.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START);
		return {container, right};
	}
}

export default ListUiLayout;
