import PainterElement from './PainterElement.js';

class Rect extends PainterElement {
	constructor(coordinate, {fill, color = '#000', thickness = 1} = {}) {
		super();
		this.coordinate = coordinate;
		this.fill = fill;
		this.color = color;
		this.thickness = thickness;
	}

	// todo [medium] refactor coordinate system to support coordinates, centered coordinates, and camera coordinates to replace current constructor overloading
	static withCamera(camera, coordinate, {fill, color, thickness} = {}) {
		return new Rect(camera.transformCoordinates(coordinate), {fill, color, thickness: camera.st(thickness)});
	}

	paint(xt, yt, context) {
		let tx = xt(this.coordinate.left);
		let ty = yt(this.coordinate.top);
		let tWidth = xt(this.coordinate.width);
		let tHeight = yt(this.coordinate.height);

		if (this.fill) {
			this.setFillMode(context);
			context.fillRect(tx, ty, tWidth, tHeight);
		} else {
			this.setLineMode(context);
			context.strokeRect(tx, ty, tWidth, tHeight);
		}
	}
}

export default Rect;
