const Logic = require('./Logic');
const Controller = require('./Controller');
const Painter = require('./painter/Painter');

const sleep = milli =>
    new Promise(resolve => setTimeout(resolve, milli));

const canvas = document.getElementById('canvas');
const logic = new Logic();
const controller = new Controller();
const painter = new Painter(canvas);

async function loop() {
    while (true) {
        painter.clear();
        logic.iterate(controller, painter);
        painter.paint();
        controller.expire();
        await sleep(10);
    }
}

loop();