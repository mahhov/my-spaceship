class RectC {
	constructor(centerX, centerY, width, height, color, fill) {
		this.centerX = centerX;
		this.centerY = centerY;
		this.width = width;
		this.height = height;
		this.color = color;
		this.fill = fill;
	}

	paint(xt, yt, context) {
		let tWidth = xt(this.width);
		let tHeight = xt(this.height);
		let x = xt(this.centerX) - tWidth / 2;
		let y = yt(this.centerY) - tHeight / 2;

		if (this.fill) {
			context.fillStyle = this.color || '#000';
			context.fillRect(x, y, tWidth, tHeight);
		} else
			context.strokeRect(x, y, tWidth, tHeight);
	}
}

module.exports = RectC;
