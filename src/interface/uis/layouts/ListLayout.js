import Coordinate from '../../../util/Coordinate.js';
import GridLayout from './GridLayout.js';

// todo [high] make sure encounters ui, hub buttons, character ui are all using this
class ListLayout extends GridLayout {
	constructor(coordinate, lineHeight) {
		super(coordinate, 1, lineHeight, 0, 0);
	}

	getCoordinates(i) {
		let {container} = super.getCoordinates(i);
		let right = container.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START);
		return {container, right};
	}
}

export default ListLayout;
