class Painter {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.xCoordinateTransform = x => x * this.width;
        this.yCoordinateTransform = y => y * this.height;
        this.context = canvas.getContext('2d');
        this.queue = [];
    }

    clear() {
        this.queue = [];
    }

    add(item) {
        this.queue.push(item);
    }

    paint() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.queue.forEach(item =>
            item.paint(this.xCoordinateTransform, this.yCoordinateTransform, this.context));
    }
}

module.exports = Painter;
