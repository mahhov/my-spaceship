const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const Controller = require('../control/Controller');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

const States = makeEnum('INACTIVE', 'ACTIVE', 'HOVER');

class Button extends Interface {
	constructor(text) {
		super();
		this.state = States.INACTIVE;
		this.text = text;
	}

	update(controller) {
		let {x, y} = controller.getRawMouse(0, 0);

		if (!this.bounds.inside(x, y))
			this.state = States.INACTIVE;
		else
			this.state = Controller.isActive(controller.getMouseState()) ? States.ACTIVE : States.HOVER;
	}

	paint(painter) {
		const INACTIVE_COLOR = '#fff'; // tood [high] use actual color and ui constants
		const HOVER_COLOR = '#f3f3f3';
		const ACTIVE_COLOR = '#e7e7e7';
		let color = [INACTIVE_COLOR, ACTIVE_COLOR, HOVER_COLOR][this.state];

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;
