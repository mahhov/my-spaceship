import Rect from '../../painter/elements/Rect.js';
import {Colors} from '../../util/constants.js';
import UiComponent from './UiComponent.js';

class UiLine extends UiComponent {
	constructor(coordinate) {
		super(coordinate);
	}

	paint(painter) {
		painter.add(new Rect(this.coordinate).setOptions({color: Colors.Interface.DULL_BORDER.get()}));
	}
}

export default UiLine;
