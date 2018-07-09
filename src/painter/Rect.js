const PainterElement = require('./PainterElement');

class Rect extends PainterElement {
	constructor(x, y, width, height, color, fill) {
		super();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.color = color;
		this.fill = fill;
	}

	paint(xt, yt, context) {
		let tx = xt(this.x);
		let ty = yt(this.y);
		let tWidth = xt(this.width);
		let tHeight = xt(this.height);

		if (this.fill) {
			context.fillStyle = this.color || '#000';
			context.fillRect(tx, ty, tWidth, tHeight);
		} else {
			context.strokeStyle = this.color || '#000';
			context.strokeRect(tx, ty, tWidth, tHeight);
		}
	}
}

module.exports = Rect;
