const PainterElement = require('./PainterElement');

class Line extends PainterElement {
	constructor(x, y, x2, y2) {
		super();
		this.x = x;
		this.y = y;
		this.x2 = x2;
		this.y2 = y2;
	}

	paint(xt, yt, context) {
		context.beginPath();
		context.moveTo(xt(this.x), yt(this.y));
		context.lineTo(xt(this.x2), yt(this.y2));
		context.stroke();
	}
}

module.exports = Line;
