import PainterElement from './PainterElement.js';

class Path extends PainterElement {
	constructor(xys, closed) {
		super();
		this.xys = xys;
		this.closed = closed;
	}

	setOptions({fill = false, color = '#000', thickness = 1} = {}) {
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
		return this;
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
		if (this.fill === 'double') {
			this.setDoubleMode(context);
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
		if (this.closed)
			context.closePath();
	}
}

export default Path;
