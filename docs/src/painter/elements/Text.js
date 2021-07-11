import {Positions} from '../../util/constants.js';
import PainterElement from './PainterElement.js';

class Text extends PainterElement {
	constructor(coordinate, text) {
		super();
		this.coordinate = coordinate;
		this.text = text;
	}

	setOptions({color = '#fff', size = Positions.UI_DEFAULT_FONT_SIZE} = {}) {
		this.color = color;
		this.size = size;
		return this;
	}

	paint(xt, yt, context) {
		this.setFillMode(context);
		this.setFont(context);

		let tx = xt(this.coordinate.x);
		let ty = yt(this.coordinate.y);
		context.fillText(this.text, tx, ty);
	}
}

export default Text;
