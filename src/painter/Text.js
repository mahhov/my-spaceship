const PainterElement = require('./PainterElement');

class Text extends PainterElement {
	constructor(x, y, text, {color = '#000', size = '18px', align = 'center'} = {}) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
		this.color = color;
		this.size = size;
		this.align = align;
	}

	paint(xt, yt, context) {
		this.setFillMode(context);
		this.setFont(context);

		let tx = xt(this.x);
		let ty = yt(this.y);
		context.fillText(this.text, tx, ty);
	}
}

module.exports = Text;
