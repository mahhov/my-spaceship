const Line = require('./painter/Line');
const Rect = require('./painter/Rect');
const RectC = require('./painter/RectC');
const Rock = require('./entities/Rock');

let speed = .004, size = .01;
let x = .5, y = .5;
let rock = new Rock(.2, .2);

class Logic {
    constructor() {
        this.rocks = [];
        for (let i = 0; i < 100; i++) // todo forEach
            this.rocks.push(new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1));
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

        this.rocks.forEach(rock =>
            rock.paint(painter));

        painter.add(rect);
    }
}

module.exports = Logic;
