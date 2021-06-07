import Coordinate from '../../util/Coordinate.js';
import PainterElement from './PainterElement.js';
import Rect from './Rect.js';

class Bar extends PainterElement {
	// todo [medium] replace constructor param with setOptions() like Text
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		this.empty = new Rect(new Coordinate(x, y, width, height)).setOptions({fill: true, color: emptyColor});
		this.fill = new Rect(new Coordinate(x, y, width * fillRatio, height)).setOptions({fill: true, color: fillColor});
		this.border = new Rect(new Coordinate(x, y, width, height)).setOptions({color: borderColor});
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
