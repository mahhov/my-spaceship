import {Positions} from './constants.js';
import makeEnum from './enum.js';

const Aligns = makeEnum({START: 0, CENTER: 0, END: 0});

class Coordinate {
	constructor(x, y, width = 0, height = width) {
		this.x = x;
		this.y = y;
		this.size(width, height);
		this.align(Aligns.START);
	}

	get clone() {
		// todo [medium] make owners of UiComponents clone coordinates before passing to constructor.
		return new Coordinate(this.x, this.y, this.width, this.height).align(this.alignment, this.vertAlignment);
	}

	size(width, height = width) {
		this.width = width;
		this.height = height;
		return this;
	}

	scale(widthScale, heightScale = widthScale) {
		this.width *= widthScale;
		this.height *= heightScale;
		return this;
	}

	align(alignment, vertAlignment = alignment) {
		this.alignment = alignment;
		this.vertAlignment = vertAlignment;
		return this;
	}

	alignWithoutMove(alignment, vertAlignment = alignment) {
		this.x = Coordinate.getAligned(alignment, this.left, -this.width);
		this.y = Coordinate.getAligned(vertAlignment, this.top, -this.height);
		return this.align(alignment, vertAlignment);
	}

	moveTo(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	move(dx, dy = dx) {
		this.x += dx;
		this.y += dy;
		return this;
	}

	shift(widths, heights = widths) {
		this.x += widths * this.width;
		this.y += heights * this.height;
		return this;
	}

	pad(width, height = width) {
		this.x += Coordinate.getAligned(this.alignment, width, width * 2);
		this.y += Coordinate.getAligned(this.vertAlignment, height, height * 2);
		this.width -= width * 2;
		this.height -= height * 2;
		return this;
	}

	clamp(left = Positions.BREAK * 2, right = 1 - left, top = left, bottom = right) {
		let dx = Math.max(left - this.left, 0) + Math.min(right - this.right, 0);
		let dy = Math.max(top - this.top, 0) + Math.min(bottom - this.bottom, 0);
		return this.move(dx, dy);
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

	get right() {
		return this.left + this.width;
	}

	get bottom() {
		return this.top + this.height;
	}
}

Coordinate.Aligns = Aligns;

export default Coordinate;
