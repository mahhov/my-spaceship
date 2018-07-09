class Painter {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.xCoordinateTransform = x => x * this.width;
        this.yCoordinateTransform = y => y * this.height;
        this.context = canvas.getContext('2d');
	    this.elements = [];
    }

    clear() {
	    this.elements = [];
    }

	add(element) {
		this.elements.push(element);
    }

    paint() {
        this.context.clearRect(0, 0, this.width, this.height);
	    this.elements.forEach(element =>
		    element.paint(this.xCoordinateTransform, this.yCoordinateTransform, this.context));
    }
}

module.exports = Painter;
