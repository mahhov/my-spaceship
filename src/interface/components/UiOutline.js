import RoundedRect from '../../painter/elements/RoundedRect.js';
import {Colors} from '../../util/constants.js';
import UiComponent from './UiComponent.js';

class UiOutline extends UiComponent {
	constructor(coordinate) {
		super(coordinate);
	}

	paint(painter) {
		painter.add(new RoundedRect(this.coordinate).setOptions({color: Colors.Interface.DULL_BORDER.get()}));
	}
}

export default UiOutline;
