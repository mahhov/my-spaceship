class Painter {
	constructor(canvas) {
		this.width = canvas.width;
		this.height = canvas.height;
		// this.createMask();
		this.xCoordinateTransform = x => x * this.width;
		this.yCoordinateTransform = y => y * this.height;
		this.context = canvas.getContext('2d');
		this.elements = [];
	}

	createMask() {
		this.maskCanvas = document.createElement('canvas'); // todo better way of creating canvas
		this.maskCanvas.width = this.width;
		this.maskCanvas.height = this.height;
		this.maskContext = this.maskCanvas.getContext('2d');
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

		// this.maskContext.globalCompositeOperation = 'source-over';
		// this.maskContext.fillStyle = "black";
		// this.maskContext.fillRect(0, 0, this.width, this.height);
		// this.maskContext.globalCompositeOperation = 'xor';
		// this.maskContext.fillRect(100, 100, 500, 500);
		// this.context.drawImage(this.maskCanvas, 0, 0);
	}
}

module.exports = Painter;
