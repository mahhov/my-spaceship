const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const {Colors} = require('../util/Constants');
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
			this.state = controller.getMouseState(0).active ? States.ACTIVE : States.HOVER;
	}

	paint(painter) {
		let color = [Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;
