const makeEnum = require('../util/Enum');

const Direction = makeEnum('LEFT', 'TOP', 'RIGHT', 'BOTTOM');

class Bounds {
	constructor(...leftTopRightBottom) {
		if (leftTopRightBottom)
			this.set(...leftTopRightBottom);
	}

	set(left, top, right, bottom) {
		this.values = [];
		this.values[Direction.LEFT] = left;
		this.values[Direction.TOP] = top;
		this.values[Direction.RIGHT] = right;
		this.values[Direction.BOTTOM] = bottom;
	}

	get(direction) {
		return this.values[direction];
	}

	getOpposite(direction) {
		return this.get(this.oppositeDirection(direction));
	}

	intersects(bounds) {
		const signs = [-1, -1, 1, 1];
		return this.values.every((value, direction) =>
			value * signs[direction] > bounds.getOpposite(direction) * signs[direction]);
	}

	oppositeDirection(direction) {
		switch (direction) {
			case Direction.LEFT:
				return Direction.RIGHT;
			case Direction.TOP:
				return Direction.BOTTOM;
			case Direction.RIGHT:
				return Direction.LEFT;
			case Direction.BOTTOM:
				return Direction.TOP;
		}
	}

	copy(bound) {
		return new Bounds(...this.values);
	}
}

module.exports = {Bounds, Direction};
