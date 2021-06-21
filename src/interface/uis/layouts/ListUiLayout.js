import Coordinate from '../../../util/Coordinate.js';
import UiGridLayout from './UiGridLayout.js';

// todo [high] make sure encounters ui, hub buttons, character ui are all using this
// todo [high] rename ListLayout
class ListUiLayout extends UiGridLayout {
	constructor(coordinate, lineHeight) {
		super(coordinate, 1, lineHeight, 0, 0);
	}

	getCoordinates(i) {
		let {container} = super.getCoordinates(i);
		let right = container.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START);
		return {container, right};
	}
}

export default ListUiLayout;
