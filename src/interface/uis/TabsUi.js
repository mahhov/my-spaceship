import {Positions} from '../../util/constants.js';
import UiButton from '../components/UiButton.js';
import Ui from '../uis/Ui.js';

class TabsUi extends Ui {
	constructor(coordinate, texts, hotkeys = false, vertical = false) {
		super(null);
		this.buttons = texts.map((text, i) => {
			let button = this.add(new UiButton(coordinate, text, hotkeys ? i + 1 : '', true));
			coordinate = coordinate.clone.shift(!vertical, vertical);
			if (i !== texts.length - 1)
				coordinate.move(Positions.MARGIN / 2 * !vertical, Positions.MARGIN / 2 * vertical);
			button.on('click', () => {
				this.setActiveUiSets(i);
				this.emit('select', i);
			});
			return button;
		});
		this.nextCoordinate = coordinate;
	}

	setUiSets(uiSets) {
		this.uiSets = uiSets;
		this.setActiveUiSets(0);
		return this;
	}

	setActiveUiSets(index) {
		this.buttons.forEach((button, i) =>
			button.setPaintMode(i === index ? UiButton.PaintModes.ACTIVE : UiButton.PaintModes.NORMAL));
		this.uiSets
			.filter((_, i) => i !== index)
			.forEach(uis => this.setActiveUis(uis, false));
		this.setActiveUis(this.uiSets[index], true);
	}

	setActiveUis(uis, visible) {
		uis.forEach(ui => ui.visible = visible);
	}
}

export default TabsUi;
