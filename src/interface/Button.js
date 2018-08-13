const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const {UiCs} = require('../util/UiConstants');
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
		let {x, y} = controller.getRawMouse();

		if (!this.bounds.inside(x, y))
			this.state = States.INACTIVE;
		else
			this.state = controller.getMouseState().active ? States.ACTIVE : States.HOVER;
	}

	paint(painter) {
		let color = [UiCs.Interface.INACTIVE, UiCs.Interface.ACTIVE, UiCs.Interface.HOVER][this.state].get();

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;
