const PainterElement = require('./PainterElement');

class Rect extends PainterElement {
	constructor(x, y, width, height, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
	}

	static withCamera(camera, x, y, width, height, {fill, color, thickness = 1} = {}) {
		return new Rect(camera.xt(x), camera.yt(y), camera.st(width), camera.st(height), {fill, color, thickness: camera.st(thickness)});
	}

	paint(xt, yt, context) {
		let tx = xt(this.x);
		let ty = yt(this.y);
		let tWidth = xt(this.width);
		let tHeight = xt(this.height);

		if (this.fill) {
			this.setFillMode(context);
			context.fillRect(tx, ty, tWidth, tHeight);
		} else {
			this.setLineMode(context);
			context.strokeRect(tx, ty, tWidth, tHeight);
		}
	}
}

module.exports = Rect;
