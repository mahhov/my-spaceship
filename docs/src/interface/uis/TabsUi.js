import {Positions} from '../../util/constants.js';
import UiButton from '../components/UiButton.js';
import Ui from '../uis/Ui.js';

class TabsUi extends Ui {
	constructor(coordinate, texts, uiSets = texts.map(_ => []), hotkeys = false) {
		super(coordinate);
		this.buttons = texts.map((text, i) => {
			let button = this.add(new UiButton(coordinate, text, hotkeys ? i + 1 : '', false, true));
			coordinate = coordinate.clone.shift(1, 0).move(Positions.MARGIN / 2, 0);
			button.on('click', () => {
				this.setActiveUiSets(i);
				this.emit('select', i);
			});
			return button;
		});
		this.uiSets = uiSets;
	}

	set uiSets(uiSets) {
		this.uiSets_ = uiSets;
		this.setActiveUiSets(0);
	}

	setActiveUiSets(index) {
		this.buttons.forEach((button, i) => button.forcedActive = i === index);
		this.uiSets_
			.filter((_, i) => i !== index)
			.forEach(uis => this.setActiveUis(uis, false));
		this.setActiveUis(this.uiSets_[index], true);
	}

	setActiveUis(uis, visible) {
		uis.forEach(ui => ui.visible = visible);
	}
}

export default TabsUi;
