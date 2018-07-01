const Bounds = require('../intersection/Bounds');
const RectC = require('../painter/RectC');

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = .004;
        this.size = .01;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    getX() {
        return x;
    }

    getY() {
        return y;
    }

    getSpeed() {
        return this.speed;
    }

    setIntersectionHandle(intersectionHandle) {
        this.intersectionHandle = intersectionHandle;
    }

    getIntersectionHandle() {
        return this.intersectionHandle;
    }

    getBounds() {
        let halfSize = this.Size / 2;
        return new Bounds(this.x - halfSize, this.y - halfSize, this.x + halfSize, this.y + halfSize);
    }

    paint(painter) {
        painter.add(new RectC(this.x, this.y, this.size, this.size));
    }
}

module.exports = Player;
