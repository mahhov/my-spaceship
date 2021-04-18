const makeEnum = require('../util/Enum');
const Interface = require('./Interface');
const State = require('../control/State');
const {Colors} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

const States = makeEnum('INACTIVE', 'ACTIVE', 'HOVER');

class Button extends Interface {
	constructor(text, hotkey = '') {
		super();
		this.state = States.INACTIVE;
		this.text = text;
		this.hotkey = hotkey;
	}

	update(controller) {
		let state = this.getState(controller);
		if (state === States.ACTIVE && this.state !== States.ACTIVE)
			this.emit('click');
		this.state = state;
	}

	getState(controller) {
		let {x, y} = controller.getRawMouse();
		if (this.bounds.inside(x, y) && controller.getMouseState(0).active || this.hotkey && controller.getKeyState(this.hotkey).pressed)
			return States.ACTIVE;
		else if (this.bounds.inside(x, y))
			return States.HOVER;
		else
			return States.INACTIVE;
	}

	paint(painter) {
		let color = [Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();

		painter.add(new Rect(this.left, this.top, this.width, this.height, {fill: true, color}));
		painter.add(new Rect(this.left, this.top, this.width, this.height));
		painter.add(new Text(this.left + this.width / 2, this.top + this.height / 2, this.text));
	}
}

module.exports = Button;
