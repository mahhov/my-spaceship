import PainterElement from './PainterElement.js';

class RoundedRect extends PainterElement {
	constructor(coordinate) {
		super();
		this.coordinate = coordinate;
	}

	setOptions({color = '#fff', thickness = 2} = {}) {
		this.color = color;
		this.thickness = thickness;
		return this;
	}

	paint(xt, yt, context) {
		let tLeft = xt(this.coordinate.left);
		let tTop = yt(this.coordinate.top);
		let tWidth = xt(this.coordinate.width);
		let tHeight = yt(this.coordinate.height);

		this.setFillMode(context);
		context.fillRect(tLeft - this.thickness, tTop, this.thickness, tHeight); // left
		context.fillRect(tLeft, tTop - this.thickness, tWidth, this.thickness); // top
		context.fillRect(tLeft + tWidth, tTop, this.thickness, tHeight); // right
		context.fillRect(tLeft, tTop + tHeight, tWidth, this.thickness); // bottom
	}
}

export default RoundedRect;
