import Coordinate from '../../util/Coordinate.js';
import PainterElement from './PainterElement.js';
import Rect from './Rect.js';

// todo [medium] merge with Bar.
class BarC extends PainterElement {
	// todo [medium] replace constructor param with setOptions() like Text
	constructor(x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		super();
		x -= width / 2;
		y -= height / 2;
		this.empty = new Rect(new Coordinate(x, y, width, height)).setOptions({fill: true, color: emptyColor});
		this.fill = new Rect(new Coordinate(x, y, width * fillRatio, height)).setOptions({fill: true, color: fillColor});
		this.border = new Rect(new Coordinate(x, y, width, height)).setOptions({color: borderColor});
	}

	// todo [medium] use Coordinate and camera.transformCoordinates
	static withCamera(camera, x, y, width, height, fillRatio, emptyColor, fillColor, borderColor) {
		return new BarC(camera.xt(x), camera.yt(y), camera.st(width), camera.st(height), fillRatio, emptyColor, fillColor, borderColor);
	}

	paint(xt, yt, context) {
		this.empty.paint(xt, yt, context);
		this.fill.paint(xt, yt, context);
		this.border.paint(xt, yt, context);
	}
}

export default BarC;
