const Bounds = require('../intersection/Bounds');
const RectC = require('../painter/RectC');

class Rock {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    getBounds() {
        let halfWidth = this.width / 2;
        let halfHeight = this.height / 2;
        return new Bounds(this.x - halfWidth, this.y - halfHeight, this.x + halfWidth, this.y + halfHeight);
    }

    paint(painter) {
        painter.add(new RectC(this.x, this.y, this.width, this.height));
    }
}

module.exports = Rock;
