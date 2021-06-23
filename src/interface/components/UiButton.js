import Bounds from '../../intersection/Bounds.js';
import MultilineText from '../../painter/elements/MultilineText.js';
import Rect from '../../painter/elements/Rect.js';
import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors, Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import UiComponent from './UiComponent.js';

const States = makeEnum({DISABLED: 0, FORCED_ACTIVE: 0, INACTIVE: 0, ACTIVE: 0, ACTIVE_ALT: 0, HOVER: 0});

class UiButton extends UiComponent {
	constructor(coordinate, text, hotkey = '', hidden = false, adaptiveWidth = false) {
		// todo [low] avoid using magic number 1000
		if (adaptiveWidth)
			coordinate.size(text.length * MultilineText.measureText('14px').width / 1000 + Positions.MARGIN, coordinate.height);
		super(coordinate);
		this.bounds = new Bounds(coordinate.left, coordinate.top, coordinate.right, coordinate.bottom);
		this.text = text;
		this.hotkey = hotkey;
		this.state = States.INACTIVE;
		this.hidden = hidden; // prevents painting
		this.disabled = false; // prevents updating
		this.forcedActive = false; // like disabled, but painted like active
	}

	update(controller) {
		let state = this.getState(controller);
		if (this.state === state)
			return;
		if (state === States.ACTIVE)
			this.emit('click', false);
		else if (state === States.ACTIVE_ALT)
			this.emit('click', true);
		else if (state === States.HOVER)
			this.emit('hover');
		else if (this.state === States.HOVER)
			this.emit('end-hover');
		this.state = state;
	}

	getState(controller) {
		if (this.disabled)
			return States.DISABLED;
		if (this.forcedActive)
			return States.FORCED_ACTIVE;
		let {x, y} = controller.getRawMouse();
		if (this.hotkey && controller.getKeyState(this.hotkey).pressed)
			return States.ACTIVE;
		else if (!this.bounds.inside(x, y))
			return States.INACTIVE;
		else if (controller.getMouseState(0).pressed)
			return States.ACTIVE;
		else if (controller.getMouseState(2).pressed)
			return States.ACTIVE_ALT;
		else
			return States.HOVER;
	}

	paint(painter) {
		if (this.hidden)
			return;
		this.paintBack(painter);
		let color = this.state === States.DISABLED ? Colors.Interface.DULL_BORDER.get() : Colors.Interface.PRIMARY.get();
		painter.add(new RoundedRect(this.coordinate).setOptions({color}));
		painter.add(new Text(this.coordinate.clone.alignWithoutMove(Coordinate.Aligns.CENTER), this.text)
			.setOptions({...this.textOptions, color}));
	}

	paintBack(painter) {
		let color = [Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.state].get();
		painter.add(new Rect(this.coordinate).setOptions({fill: true, color}));
	}
}

export default UiButton;
