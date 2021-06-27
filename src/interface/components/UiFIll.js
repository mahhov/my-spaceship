import Rect from '../../painter/elements/Rect.js';
import {Colors} from '../../util/constants.js';
import UiComponent from './UiComponent.js';

class UiFill extends UiComponent {
	constructor(coordinate, color) {
		super(coordinate);
		this.color = color;
	}

	paint(painter) {
		painter.add(new Rect(this.coordinate).setOptions({fill: true, color: Colors.Interface.TEXT_BACK}));
	}
}

export default UiFill;
