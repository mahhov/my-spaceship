import Bounds from '../../intersection/Bounds.js';
import Rect from '../../painter/elements/Rect.js';
import Text from '../../painter/elements/Text.js';
import {Colors} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/Enum.js';
import UiComponent from './UiComponent.js';

const States = makeEnum({DISABLED: 0, INACTIVE: 0, ACTIVE: 0, HOVER: 0});

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
		this.disabled = false;
	}

	update(controller) {
		let state = this.getState(controller);
		if (this.state === state)
			return;
		if (state === States.ACTIVE)
			this.emit('click');
		else if (state === States.HOVER)
			this.emit('hover');
		this.state = state;
	}

	getState(controller) {
		if (this.disabled)
			return States.DISABLED;
		let {x, y} = controller.getRawMouse();
		if (this.bounds.inside(x, y) && controller.getMouseState(0).pressed || this.hotkey && controller.getKeyState(this.hotkey).pressed)
			return States.ACTIVE;
		else if (this.bounds.inside(x, y))
			return States.HOVER;
		else
			return States.INACTIVE;
	}

	paint(painter) {
		let color = [Colors.Interface.DISABLED, Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();

		painter.add(new Rect(new Coordinate(this.left, this.top, this.width, this.height), {fill: true, color}));
		painter.add(new Rect(new Coordinate(this.left, this.top, this.width, this.height)));
		painter.add(new Text(new Coordinate(this.left + this.width / 2, this.top + this.height / 2).align(Coordinate.Aligns.CENTER), this.text));
	}
}

export default UiButton;
