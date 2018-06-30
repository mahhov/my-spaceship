const RectC = require('../painter/RectC');

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = .004;
        this.size = .01;
    }

    moveLeft() {
        this.x -= this.speed;
    }

    moveRight() {
        this.x += this.speed;
    }

    moveUp() {
        this.y -= this.speed;
    }

    moveDown() {
        this.y += this.speed;
    }

    paint(painter) {
        painter.add(new RectC(this.x, this.y, this.size, this.size));
    }
}

module.exports = Player;
