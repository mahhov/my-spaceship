import Bounds from '../../intersection/Bounds.js';
import Rect from '../../painter/elements/Rect.js';
import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import UiComponent from './UiComponent.js';

const States = makeEnum({DISABLED: 0, INACTIVE: 0, ACTIVE: 0, ACTIVE_ALT: 0, HOVER: 0});
const PaintModes = makeEnum({
	...States, // paint as if in a given state
	HIDDEN: 0, // don't paint
	NORMAL: 0, // paint according to state

});

class UiButton extends UiComponent {
	constructor(coordinate, text, hotkey = '', adaptiveWidth = false) {
		if (adaptiveWidth)
			coordinate.size(UiComponent.textWidth(text.length) + Positions.MARGIN, coordinate.height);
		super(coordinate);
		this.bounds = new Bounds(coordinate.left, coordinate.top, coordinate.right, coordinate.bottom);
		this.text = text;
		this.hotkey = hotkey;
		this.state = States.INACTIVE;
		this.disabled = false; // prevents updating
		this.paintMode = PaintModes.NORMAL;
	}

	setPaintMode(paintMode) {
		this.paintMode = paintMode;
		return this;
	}

	update(controller) {
		let state = this.getState(controller);
		if (this.state === state)
			return;
		let shift = controller.getKeyState('shift').active;
		if (state === States.ACTIVE)
			this.emit('click', false, shift);
		else if (state === States.ACTIVE_ALT)
			this.emit('click', true, shift);
		else if (state === States.HOVER)
			this.emit('hover');
		else if (this.state === States.HOVER)
			this.emit('end-hover');
		this.state = state;
	}

	getState(controller) {
		if (this.disabled)
			return States.DISABLED;
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

	get paintState() {
		return this.paintMode === PaintModes.NORMAL ? this.state : this.paintMode;
	}

	paint(painter) {
		if (this.paintMode === PaintModes.HIDDEN)
			return;

		this.paintBack(painter);
		let color = this.paintState === States.DISABLED ? Colors.Interface.DULL_BORDER.get() : Colors.Interface.PRIMARY.get();
		painter.add(new RoundedRect(this.coordinate).setOptions({color}));
		painter.add(new Text(this.coordinate.clone.alignWithoutMove(Coordinate.Aligns.CENTER), this.text)
			.setOptions({...this.textOptions, color}));
	}

	paintBack(painter) {
		if (this.paintMode === PaintModes.HIDDEN)
			return;

		let color = [Colors.Interface.INACTIVE, Colors.Interface.INACTIVE, Colors.Interface.ACTIVE, Colors.Interface.ACTIVE, Colors.Interface.HOVER][this.paintState].get();
		painter.add(new Rect(this.coordinate).setOptions({fill: true, color}));
	}
}

UiButton.PaintModes = PaintModes;

export default UiButton;
