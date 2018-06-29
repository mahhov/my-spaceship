class RectC {
    constructor(centerX, centerY, width, height) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.width = width;
        this.height = height;
    }

    paint(xt, yt, context) {
        let tWidth = xt(this.width);
        let tHeight = xt(this.height);
        context.strokeRect(xt(this.centerX) - tWidth / 2, yt(this.centerY) - tHeight / 2, tWidth, tHeight);
    }
}

module.exports = RectC;
