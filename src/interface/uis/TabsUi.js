import {Positions} from '../../util/constants.js';
import UiButton from '../components/UiButton.js';
import GridLayout from '../layouts/GridLayout.js';
import Ui from '../uis/Ui.js';

class TabsUi extends Ui {
	constructor(coordinate, texts, hotkeys = false) {
		super(coordinate);
		let layout = new GridLayout(coordinate, texts.length, Positions.UI_BUTTON_HEIGHT, Positions.MARGIN / 2, 0);
		let buttons = texts.map((text, i) => {
			let button = this.add(new UiButton(layout.getCoordinates(i).container, text, hotkeys ? i + 1 : ''));
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
