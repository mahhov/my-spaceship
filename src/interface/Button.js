const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const Controller = require('../control/Controller');
const Color = require('../util/Color');
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
		const INACTIVE_COLOR = Color.WHITE.get(); // tood [high] use ui constants
		const HOVER_COLOR = Color.from1(.95, .95, .95).get();
		const ACTIVE_COLOR = Color.from1(.9, .9, .9).get();
		let color = [INACTIVE_COLOR, ACTIVE_COLOR, HOVER_COLOR][this.state];

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;
