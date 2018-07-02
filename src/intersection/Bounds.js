class Bounds {
    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    getLeft() {
        return this.left;
    }

    getTop() {
        return this.top;
    }

    getRight() {
        return this.right;
    }

    getBottom() {
        return this.bottom;
    }
}

module.exports = Bounds;
