const Line = require('./painter/Line');
const Rect = require('./painter/Rect');
const RectC = require('./painter/RectC');

let speed = .004, size = .01;
let x = .5, y = .5;

class Logic {
    constructor() {
    }

    iterate(controller, painter) {
        if (controller.getKey('a'))
            x -= speed;
        if (controller.getKey('d'))
            x += speed;
        if (controller.getKey('w'))
            y -= speed;
        if (controller.getKey('s'))
            y += speed;

        let rect = new RectC(x, y, size, size);
        painter.add(rect);
    }
}

module.exports = Logic;
