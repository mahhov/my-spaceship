const RectC = require('../painter/RectC');

class Rock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    paint(painter) {
        painter.add(new RectC(this.x, this.y, this.width, this.height));
    }
}

module.exports = Rock;
