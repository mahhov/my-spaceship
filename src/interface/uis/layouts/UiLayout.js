import {Positions} from '../../../util/constants.js';
import Coordinate from '../../../util/Coordinate.js';

class UiGridLayout {
	constructor(coordinate, columns, height, horizMargin = Positions.MARGIN, vertMargin = Positions.MARGIN * 1.5) {
		this.coordinate = coordinate;
		this.width = (coordinate.width + horizMargin) / columns - horizMargin;
		this.height = height;
		this.columns = columns;
		this.horizMargin = horizMargin;
		this.vertMargin = vertMargin;
	}

	getRow(i) {
		return Math.floor(i / this.columns);
	}

	getContainerCoordinate(i) {
		return this.coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(this.width, this.height)
			.move(
				(this.width + this.horizMargin) * (i % this.columns),
				(this.height + this.vertMargin) * this.getRow(i));
	}

	getCoordinates(i) {
	}
}

export default UiGridLayout;
