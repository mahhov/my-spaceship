import Color from '../../util/Color.js';

class PainterElement {
	constructor() {
		// overridden by children
		// todo [medium] once all subclasses use coordinate, replace null with a constructor parameter
		this.coordinate = null;
		this.color = null;
		this.size = null;
		this.thickness = 1;
		this.setOptions();
	}

	setOptions() {
	}

	setFillMode(context, color = this.color) {
		context.fillStyle = color;
	}

	setLineMode(context, color = this.color, thickness = this.thickness) {
		context.strokeStyle = color;
		context.lineWidth = thickness;
	}

	setDoubleMode(context) {
		context.strokeStyle = Color.from1(0, 0, 0).get();
		context.lineWidth = 1;
	}

	setFont(context, size = this.size, alignment = this.coordinate.alignment, vertAlignment = this.coordinate.vertAlignment) {
		context.font = `${size} monospace`;
		context.textAlign = ['left', 'center', 'right'][alignment];
		context.textBaseline = ['top', 'middle', 'bottom'][vertAlignment];
	}

	paint(xt, yt, context) {
	}
}

export default PainterElement;
