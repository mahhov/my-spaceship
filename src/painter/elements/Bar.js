import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import PainterElement from './PainterElement.js';
import Rect from './Rect.js';

class Bar extends PainterElement {
	// todo [medium] replace constructor param with setOptions() like Text
	constructor(coordinate, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		this.empty = new Rect(coordinate).setOptions({fill: true, color: emptyColor});
		this.fill = new Rect(coordinate.clone.size(coordinate.width * fillRatio, coordinate.height))
			.setOptions({fill: true, color: fillColor});
		this.border = new Rect(coordinate).setOptions({color: borderColor});
	}

	static WideBar(paintUiRow, fillRatio, emptyColor, fillColor, borderColor) {
		const WIDTH = 1 - Positions.MARGIN * 2;
		let top = Positions.MARGIN * (1 + paintUiRow * 2);
		let coordinate = new Coordinate(Positions.MARGIN, top, WIDTH, Positions.MARGIN);
		return new Bar(coordinate, fillRatio, emptyColor, fillColor, borderColor);
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

export default Bar;
