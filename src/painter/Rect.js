class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    paint(xt, yt, context) {
        context.strokeRect(xt(this.x), yt(this.y), xt(this.width), yt(this.height));
    }
}

module.exports = Rect;
