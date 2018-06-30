const RectC = require('../painter/RectC');

class Rock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    paint(painter) {
        painter.add(new RectC(this.x, this.y, .1, .1));
    }
}

module.exports = Rock;
