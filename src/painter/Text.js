const PainterElement = require('./PainterElement');

class Text extends PainterElement {
	constructor(x, y, text, {color = '#000'} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
	}

	paint(xt, yt, context) {
		let tx = xt(this.x);
		let ty = yt(this.y);
		this.setFillMode(context);
		context.fillText(this.text, tx, ty);
	}
}

module.exports = Text;
