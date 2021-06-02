import Color from '../../util/Color.js';

class PainterElement {
	constructor() {
		// overridden by children
		this.coordinate = null;
		this.color = null;
		this.size = null;
		this.thickness = null;
	}

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
		context.textAlign = this.coordinate.textAlignment;
		context.textBaseline = this.coordinate.vertTextAlignment;
		context.font = `${this.size} monospace`;
	}

	paint(xt, yt, context) {
	}
}

export default PainterElement;
