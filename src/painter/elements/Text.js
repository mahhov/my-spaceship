import PainterElement from './PainterElement.js';

class Text extends PainterElement {
	constructor(coordinate, text, {color = '#000', size = '18px'} = {}) {
		super();
		this.coordinate = coordinate;
		this.text = text;
		this.color = color;
		this.size = size;
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
