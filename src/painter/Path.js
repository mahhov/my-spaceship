const PainterElement = require('./PainterElement');

class Path extends PainterElement {
	constructor(xys, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.xys = xys;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
	}

	paint(xt, yt, context) {
		if (this.fill) {
			this.setFillMode(context);
			this.paintPath(xt, yt, context);
			context.fill();
		} else {
			this.setLineMode(context);
			this.paintPath(xt, yt, context);
			context.stroke();
		}
	}

	paintPath(xt, yt, context) {
		context.beginPath();
		let xyt = xy => [xt(xy[0]), yt(xy[1])];
		context.moveTo(...xyt(this.xys[0]));
		this.xys.forEach(xy =>
			context.lineTo(...xyt(xy)));
		context.closePath();
	}
}

module.exports = Path;
