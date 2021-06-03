import PainterElement from './PainterElement.js';

class Text extends PainterElement {
	constructor(coordinate, text) {
		super();
		this.coordinate = coordinate;
		this.text = text;
		this.setOptions();
	}

	setOptions({color = '#000', size = '18px'} = {}) {
		this.color = color;
		this.size = size;
		return this;
	}

	paint(xt, yt, context) {
		this.setFillMode(context);
		this.setFont(context);

		let tx = xt(this.coordinate.left);
		let ty = yt(this.coordinate.top);
		context.fillText(this.text, tx, ty);
	}
}

export default Text;
