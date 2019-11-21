const Color = require('../util/Color');

class PainterElement {
	setFillMode(context) {
		context.fillStyle = this.color;
	}

	setLineMode(context) {
		context.strokeStyle = this.color;
		context.lineWidth = this.thickness || 1;
	}

	setDoubleMode(context) {
		context.strokeStyle = Color.from1(0, 0, 0).get();
		context.lineWidth = 1;
	}

	setFont(context) {
		context.textAlign = this.align;
		context.font = `${this.size} monospace`;
	}

	paint(painter) {
	}
}

module.exports = PainterElement;
