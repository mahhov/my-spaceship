import PainterElement from './PainterElement.js';

class Rect extends PainterElement {
	constructor(coordinate) {
		super();
		this.coordinate = coordinate;
	}

	setOptions({fill = false, color = '#fff', thickness = 1} = {}) {
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
		return this;
	}

	static withCamera(camera, coordinate, {fill, color, thickness} = {}) {
		return new Rect(camera.transformCoordinates(coordinate)).setOptions({fill, color, thickness: camera.st(thickness)});
	}

	paint(xt, yt, context) {
		let tLeft = xt(this.coordinate.left);
		let tTop = yt(this.coordinate.top);
		let tWidth = xt(this.coordinate.width);
		let tHeight = yt(this.coordinate.height);

		if (this.fill) {
			this.setFillMode(context);
			context.fillRect(tLeft, tTop, tWidth, tHeight);
		} else {
			this.setLineMode(context);
			context.strokeRect(tLeft, tTop, tWidth, tHeight);
		}
	}
}

export default Rect;
