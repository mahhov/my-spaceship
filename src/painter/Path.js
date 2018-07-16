const PainterElement = require('./PainterElement');

class Path extends PainterElement {
	constructor(xys, color) {
		super();
		this.xys = xys;
		this.color = color;
	}

	paint(xt, yt, context) {
		context.strokeStyle = this.color || '#000';
		context.beginPath();
		let xyt = xy => [xt(xy[0]), yt(xy[1])];
		context.moveTo(...xyt(this.xys[0]));
		this.xys.forEach(xy =>
			context.lineTo(...xyt(xy)));
		context.closePath();
		context.stroke();
	}
}

module.exports = Path;
