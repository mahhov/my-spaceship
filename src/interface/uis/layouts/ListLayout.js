import Coordinate from '../../../util/Coordinate.js';
import GridLayout from './GridLayout.js';

class ListLayout extends GridLayout {
	constructor(coordinate, lineHeight, vertMargin = 0) {
		super(coordinate, 1, lineHeight, 0, vertMargin);
	}

	getCoordinates(i) {
		let {container} = super.getCoordinates(i);
		let right = container.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START);
		return {container, right};
	}
}

export default ListLayout;
