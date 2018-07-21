const PainterElement = require('./PainterElement');
const Rect = require('./Rect');

class Bar extends PainterElement {
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		this.empty = new Rect(x, y, width, height, {fill: true, color: emptyColor});
		this.fill = new Rect(x, y, width * fillRatio, height, {fill: true, color: fillColor});
		this.border = new Rect(x, y, width, height, {color: borderColor});
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

module.exports = Bar;
