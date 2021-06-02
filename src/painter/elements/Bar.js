import PainterElement from './PainterElement.js';
import Rect from './Rect.js';

class Bar extends PainterElement {
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		this.empty = new Rect(x, y, width, height, {fill: true, color: emptyColor});
		this.fill = new Rect(x, y, width * fillRatio, height, {fill: true, color: fillColor});
		this.border = new Rect(x, y, width, height, {color: borderColor});
	}

	static WideBar(paintUiRow, fillRatio, emptyColor, fillColor, borderColor) {
		const MARGIN = .02, WIDTH = 1 - MARGIN * 2;
		let top = MARGIN * (1 + paintUiRow * 2);
		return new Bar(MARGIN, top, WIDTH, MARGIN, fillRatio, emptyColor, fillColor, borderColor);
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

export default Bar;
