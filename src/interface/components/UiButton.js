import makeEnum from '../../util/Enum.js';
import UiComponent from './UiComponent.js';
import Bounds from '../../intersection/Bounds.js';
import {Colors} from '../../util/Constants.js';
import Rect from '../../painter/elements/Rect.js';
import Text from '../../painter/elements/Text.js';

const States = makeEnum('INACTIVE', 'ACTIVE', 'HOVER');

class UiButton extends UiComponent {
	constructor(left, top, width, height, text, hotkey = '') {
		super();
		this.left = left;
		this.top = top;
		this.width = width;
		this.height = height;
		this.bounds = new Bounds(left, top, left + width, top + height);
		this.text = text;
		this.hotkey = hotkey;
		this.state = States.INACTIVE;
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

export default UiButton;
