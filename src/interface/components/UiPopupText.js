import Rect from '../../painter/elements/Rect.js';
import RoundedRect from '../../painter/elements/RoundedRect.js';
import Text from '../../painter/elements/Text.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiComponent from './UiComponent.js';

class UiPopupText extends UiComponent {
	constructor(coordinate) {
		super(coordinate.align(Coordinate.Aligns.START, Coordinate.Aligns.END));
		this.hoverBounds = null;
		this.texts = [];
	}

	beginHover(hoverBounds, texts) {
		this.hoverBounds = hoverBounds;
		this.texts = texts;
	}

	endHover() {
		this.hoverBounds = null;
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
		this.coordinate.size(this.coordinate.width, Positions.UI_LINE_HEIGHT * this.texts.length + Positions.BREAK * 2);
		painter.add(new Rect(this.coordinate).setOptions({fill: true, color: Colors.Interface.INACTIVE.get()}));
		painter.add(new RoundedRect(this.coordinate).setOptions({color: Colors.Interface.PRIMARY.get()}));
		let textCoordinate = this.coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.move(Positions.BREAK * 3) // 3 just works well
			.size(0, Positions.UI_LINE_HEIGHT);
		this.texts.forEach((text, i) =>
			painter.add(new Text(textCoordinate.clone.shift(0, i), text).setOptions({...this.textOptions, color: Colors.Interface.PRIMARY.get()})));
	}
}

export default UiPopupText;
