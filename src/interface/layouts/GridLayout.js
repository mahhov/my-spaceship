import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';

class GridLayout {
	constructor(coordinate, columns, height, horizMargin = Positions.MARGIN, vertMargin = Positions.MARGIN * 1.5) {
		this.width = (coordinate.width + horizMargin) / columns - horizMargin;
		this.height = height;
		this.columns = columns;
		this.horizMargin = horizMargin;
		this.vertMargin = vertMargin;
		// todo [high] make caller responsible for cloning coordinate, and receiver can mutate it however it desires
		this.coordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(this.width, height);
	}

	static createWithFixedColumnWidth(coordinate, columns, columnWidth, height, horizMargin = Positions.MARGIN, vertMargin = Positions.MARGIN * 1.5) {
		coordinate.size(GridLayout.totalWidth(columns, columnWidth, horizMargin));
		return new GridLayout(coordinate, columns, height, horizMargin, vertMargin);
	}

	static totalWidth(columns, columnWidth, horizMargin) {
		return columnWidth * columns + horizMargin * (columns - 1);
	}

	get totalWidth() {
		return GridLayout.totalWidth(this.columns, this.width, this.horizMargin);
	}

	getRow(i) {
		return Math.floor(i / this.columns);
	}

	getCoordinates(i) {
		let container = this.coordinate.clone.move(
			(this.width + this.horizMargin) * (i % this.columns),
			(this.height + this.vertMargin) * this.getRow(i));
		return {container};
	}

	getCoordinatesRowColumn(row, column) {
		return this.getCoordinates(row * this.columns + column);
	}
}

export default GridLayout;
