import makeEnum from '../util/Enum.js';

const Directions = makeEnum({LEFT: 0, TOP: 0, RIGHT: 0, BOTTOM: 0});

class Bounds {
	constructor(...leftTopRightBottom) {
		if (leftTopRightBottom)
			this.set(...leftTopRightBottom);
	}

	set(left, top, right = left, bottom = top) {
		this.values = [];
		this.values[Directions.LEFT] = left;
		this.values[Directions.TOP] = top;
		this.values[Directions.RIGHT] = right;
		this.values[Directions.BOTTOM] = bottom;
	}

	get(direction) {
		return this.values[direction];
	}

	getOpposite(direction) {
		return this.get(Bounds.oppositeDirection(direction));
	}

	intersects(bounds) {
		const signs = [-1, -1, 1, 1];
		return this.values.every((value, direction) =>
			value * signs[direction] > bounds.getOpposite(direction) * signs[direction]);
	}

	inside(x, y) {
		return this.intersects(new Bounds(x, y, x, y));
	}

	static oppositeDirection(direction) {
		switch (direction) {
			case Directions.LEFT:
				return Directions.RIGHT;
			case Directions.TOP:
				return Directions.BOTTOM;
			case Directions.RIGHT:
				return Directions.LEFT;
			case Directions.BOTTOM:
				return Directions.TOP;
		}
	}
}

Bounds.Directions = Directions;

export default Bounds;
