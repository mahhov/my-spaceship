import makeEnum from './Enum.js';

const Aligns = makeEnum({START: 0, CENTER: 0, END: 0});

class Coordinate {
	constructor(x, y, width = 0, height = width) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alignment = Aligns.START;
		this.vertAlignment = Aligns.START;
	}

	get clone() {
		return new Coordinate(this.x, this.y, this.width, this.height).align(this.alignment, this.vertAlignment);
	}

	align(alignment, vertAlignment = alignment) {
		this.alignment = alignment;
		this.vertAlignment = vertAlignment;
		return this;
	}

	pad(padding) {
		this.x += Coordinate.getAligned(this.alignment, padding, padding * 2);
		this.y += Coordinate.getAligned(this.vertAlignment, padding, padding * 2);
		this.width -= padding * 2;
		this.height -= padding * 2;
		return this;
	}

	static getAligned(alignment, xy, widthHeight) {
		switch (alignment) {
			case Aligns.START:
				return xy;
			case Aligns.CENTER:
				return xy - widthHeight / 2;
			case Aligns.END:
				return xy - widthHeight;
		}
	}

	get left() {
		return Coordinate.getAligned(this.alignment, this.x, this.width);
	}

	get top() {
		return Coordinate.getAligned(this.vertAlignment, this.y, this.height);
	}

	get textAlignment() {
		return ['left', 'center', 'right'][this.alignment];
	}

	get vertTextAlignment() {
		return ['top', 'middle', 'bottom'][this.vertAlignment];
		// return ['hanging', 'middle', 'alphabetic'][this.vertAlignment];
	}
}

Coordinate.Aligns = Aligns;

export default Coordinate;
