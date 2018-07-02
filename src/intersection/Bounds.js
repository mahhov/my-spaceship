class Bounds {
    constructor(left, top, right, bottom) {
        this.LEFT = 0, this.TOP = 1, this.RIGHT = 2, this.BOTTOM = 3;
        this.SIGNS = [-1, -1, 1, 1];

        this.values = [];
        this.values[this.LEFT] = left;
        this.values[this.TOP] = top;
        this.values[this.RIGHT] = right;
        this.values[this.BOTTOM] = bottom;
    }

    getLeft() {
        return this.get(this.LEFT);
    }

    getTop() {
        return this.get(this.TOP);
    }

    getRight() {
        return this.get(this.RIGHT);
    }

    getBottom() {
        return this.get(this.BOTTOM);
    }

    get(direction) {
        return this.values[direction];
    }

    getOpposite(direction) {
        return this.get(this.oppositeDirection(direction));
    }

    set(direction, value) {
        this.values[direction] = value;
    }

    expand(direction, magnitude) {
        this.values[direction] += magnitude * this.SIGNS[direction];
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
