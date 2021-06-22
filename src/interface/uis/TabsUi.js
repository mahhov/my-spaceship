import {Positions} from '../../util/constants.js';
import UiButton from '../components/UiButton.js';
import Ui from '../uis/Ui.js';

class TabsUi extends Ui {
	constructor(coordinate, texts, hotkeys = false) {
		super(coordinate);
		let buttons = texts.map((text, i) => {
			let button = this.add(new UiButton(coordinate, text, hotkeys ? i + 1 : '', false, true));
			coordinate = coordinate.clone.shift(1, 0).move(Positions.MARGIN / 2, 0);
			button.disabled = !i;
			button.on('click', () => {
				buttons.forEach(buttonI => buttonI.disabled = buttonI === button);
				this.emit('select', i);
			});
			return button;
		});
	}
}

export default TabsUi;
