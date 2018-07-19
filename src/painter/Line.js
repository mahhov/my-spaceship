const PainterElement = require('./PainterElement');

class Line extends PainterElement {
	constructor(x, y, x2, y2, color) {
		super();
		this.x = x;
		this.y = y;
		this.x2 = x2;
		this.y2 = y2;
		this.color = color;
	}

	static withCamera(camera, x, y, x2, y2, color) {
		return new Line(camera.xt(x), camera.yt(y), camera.xt(x2), camera.yt(y2), color);
	}

	paint(xt, yt, context) {
		context.strokeStyle = this.color || '#000';
		context.beginPath();
		context.moveTo(xt(this.x), yt(this.y));
		context.lineTo(xt(this.x2), yt(this.y2));
		context.stroke();
	}
}

module.exports = Line;
