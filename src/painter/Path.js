const PainterElement = require('./PainterElement');

class Path extends PainterElement {
	constructor(xys, {color = '#000', thickness = 1} = {}) {
		super();
		this.xys = xys;
		this.color = color;
		this.thickness = thickness;
	}

	paint(xt, yt, context) {
		this.setLineMode(context);
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
