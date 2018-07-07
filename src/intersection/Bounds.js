class Bounds {
	constructor(...leftTopRightBottom) {
		this.LEFT = 0, this.TOP = 1, this.RIGHT = 2, this.BOTTOM = 3; // todo convert to enum
		this.SIGNS = [-1, -1, 1, 1];

		if (leftTopRightBottom)
			this.set(...leftTopRightBottom);
	}

	set(left, top, right, bottom) {
		this.values = [];
		this.values[this.LEFT] = left;
		this.values[this.TOP] = top;
		this.values[this.RIGHT] = right;
		this.values[this.BOTTOM] = bottom;
	}

	get(direction) {
		return this.values[direction];
	}

	getOpposite(direction) {
		return this.get(this.oppositeDirection(direction));
	}

	intersects(bounds) {
		return this.values.every((value, direction) =>
			value * this.SIGNS[direction] > bounds.getOpposite(direction) * this.SIGNS[direction]);
	}

	oppositeDirection(direction) {
		switch (direction) {
			case this.LEFT:
				return this.RIGHT;
			case this.TOP:
				return this.BOTTOM;
			case this.RIGHT:
				return this.LEFT;
			case this.BOTTOM:
				return this.TOP;
		}
	}

	copy(bound) {
		return new Bounds(...this.values);
	}
}

module.exports = Bounds;
