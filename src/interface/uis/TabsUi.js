import {Positions} from '../../util/constants.js';
import UiButton from '../components/UiButton.js';
import UiIconButton from '../components/UiIconButton.js';
import Ui from '../uis/Ui.js';

class TabsUi extends Ui {
	constructor(buttons, nextCoordinate) {
		super(null);
		this.buttons = buttons;
		buttons.forEach((button, i) =>
			this.add(button).on('click', () => {
				this.setActiveUiSets(i);
				this.emit('select', i);
			}));
		this.nextCoordinate = nextCoordinate;
	}

	static createWithButtons(coordinate, texts, hotkeys = false, vertical = false) {
		let buttons = texts.map((text, i) => {
			let button = new UiButton(coordinate, text, hotkeys ? i + 1 : '', true);
			coordinate = TabsUi.nextCoordinate(coordinate, vertical, i === texts.length - 1);
			return button;
		});
		return new TabsUi(buttons, coordinate);
	}

	static createWithIconButtons(coordinate, imagePaths, hotkeys = false, vertical = false) {
		let buttons = imagePaths.map((imagePath, i) => {
			let button = new UiIconButton(coordinate, imagePath, hotkeys ? i + 1 : '', true);
			coordinate = TabsUi.nextCoordinate(coordinate, vertical, i === imagePaths.length - 1);
			return button;
		});
		return new TabsUi(buttons, coordinate);
	}

	static nextCoordinate(coordinate, vertical, isLast) {
		coordinate = coordinate.clone.shift(!vertical, vertical);
		if (!isLast)
			coordinate.move(Positions.MARGIN / 2 * !vertical, Positions.MARGIN / 2 * vertical);
		return coordinate;
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
