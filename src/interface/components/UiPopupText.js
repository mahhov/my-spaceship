import Rect from '../../painter/elements/Rect.js';
import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors, Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

// todo [medium] support multiline
class UiPopupText extends UiComponent {
	constructor(coordinate) {
		super(coordinate.align(Coordinate.Aligns.START, Coordinate.Aligns.END));
		this.hoverBounds = null;
		this.text = '';
	}

	beginHover(hoverBounds, text) {
		this.hoverBounds = hoverBounds;
		this.text = text;
	}

	update(controller) {
		let {x, y} = controller.getRawMouse();
		if (this.hoverBounds?.inside(x, y))
			this.coordinate.moveTo(x + Positions.BREAK, y - Positions.BREAK).clamp();
		else
			this.hoverBounds = null;
	}

	paint(painter) {
		if (!this.hoverBounds)
			return;
		painter.add(new Rect(this.coordinate).setOptions({fill: true, color: Colors.Interface.INACTIVE.get()}));
		painter.add(new RoundedRect(this.coordinate).setOptions({color: Colors.Interface.PRIMARY.get()}));
		let textCoordinate = this.coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.CENTER)
			.move(Positions.BREAK * 2, 0);
		painter.add(new Text(textCoordinate, this.text).setOptions({...this.textOptions, color: Colors.Interface.PRIMARY.get()}));
	}
}

export default UiPopupText;
