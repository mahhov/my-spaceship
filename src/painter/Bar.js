const Rect = require('./Rect');

class Bar {
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		this.empty = new Rect(x, y, width, height, emptyColor, true);
		this.fill = new Rect(x, y, width * fillRatio, height, fillColor, true);
		this.border = new Rect(x, y, width, height, borderColor, false);
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

module.exports = Bar;
