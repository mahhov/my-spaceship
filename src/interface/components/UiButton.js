import Bounds from '../../intersection/Bounds.js';
import Rect from '../../painter/elements/Rect.js';
import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import UiComponent from './UiComponent.js';

const States = makeEnum({DISABLED: 0, INACTIVE: 0, ACTIVE: 0, HOVER: 0});

class UiButton extends UiComponent {
	constructor(coordinate, text, hotkey = '', hidden = false) {
		super(coordinate);
		this.bounds = new Bounds(coordinate.left, coordinate.top, coordinate.right, coordinate.bottom);
		this.text = text;
		this.hotkey = hotkey;
		this.state = States.INACTIVE;
		this.hidden = hidden; // prevents painting
		this.disabled = false; // prevents updating
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
		if (this.hidden)
			return;

		let backColor = [Colors.Interface.INACTIVE, Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();
		let color = this.state === States.DISABLED ? Colors.Interface.DULL_BORDER.get() : Colors.Interface.PRIMARY.get();

		painter.add(new Rect(this.coordinate).setOptions({fill: true, color: backColor}));
		painter.add(new RoundedRect(this.coordinate).setOptions({color}));
		painter.add(new Text(this.coordinate.clone.alignWithoutMove(Coordinate.Aligns.CENTER), this.text)
			.setOptions({...this.textOptions, color}));
	}
}

export default UiButton;
