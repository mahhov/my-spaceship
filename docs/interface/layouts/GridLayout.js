import Coordinate from '../../util/Coordinate.js';

class GridLayout {
	constructor(coordinate, columns, height, horizMargin = 0, vertMargin = 0) {
		this.width = GridLayout.columnWidth(coordinate.width, columns, horizMargin);
		this.height = height;
		this.columns = columns;
		this.horizMargin = horizMargin;
		this.vertMargin = vertMargin;
		// todo [high] make caller responsible for cloning coordinate, and receiver can mutate it however it desires
		this.coordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(this.width, height);
	}

	static createWithFixedColumnWidth(coordinate, columns, columnWidth, height, horizMargin = 0, vertMargin = 0) {
		coordinate.size(GridLayout.totalWidth(columns, columnWidth, horizMargin));
		return new GridLayout(coordinate, columns, height, horizMargin, vertMargin);
	}

	static createWithSquares(coordinate, columns, horizMargin = 0, vertMargin = 0) {
		let height = (coordinate.width + horizMargin) / columns - horizMargin;
		return new GridLayout(coordinate, columns, height, horizMargin, vertMargin);
	}

	static totalWidth(columns, columnWidth, horizMargin) {
		return columnWidth * columns + horizMargin * (columns - 1);
	}

	static columnWidth(totalWidth, columns, horizMargin) {
		return (totalWidth + horizMargin) / columns - horizMargin;
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
