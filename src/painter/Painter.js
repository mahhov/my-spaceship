class Painter {
	constructor(width, height) {
		this.canvas = Painter.createCanvas(width, height);
		this.width = width;
		this.height = height;
		this.xCoordinateTransform = x => x * width;
		this.yCoordinateTransform = y => y * height;
		this.context = this.canvas.getContext('2d');
		this.setFontMode();
		this.elements = []; // todo [medium] test linked list instead of array for performance
	}

	static createCanvas(width, height) {
		let canvas = document.createElement('canvas'); // todo [low] better way of creating context
		canvas.width = width;
		canvas.height = height;
		return canvas;
	}

	setFontMode() {
		this.context.textBaseline = 'middle';
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
