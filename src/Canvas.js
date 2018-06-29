const Controller = require('./Controller');
const Painter = require('./painter/Painter');
const Line = require('./painter/Line');
const Rect = require('./painter/Rect');
const RectC = require('./painter/RectC');

const sleep = milli =>
    new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const controller = new Controller();
const painter = new Painter(canvas);

async function loop() {
    let speed = .01, size = .01;
    let x = .5, y = .5;

    while (true) {
        if (controller.getKey('a'))
            x -= speed;
        if (controller.getKey('d'))
            x += speed;
        if (controller.getKey('w'))
            y -= speed;
        if (controller.getKey('s'))
            y += speed;

        let rect = new RectC(x, y, size, size);
        painter.clear();
        painter.add(rect);
        painter.paint();
        controller.expire();
        await sleep(10);
    }
}

loop();