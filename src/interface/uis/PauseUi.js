import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class PauseUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.5, .15).align(Coordinate.Aligns.CENTER), 'Paused').setTextOptions({size: '22px'}));
		this.add(new UiButton(new Coordinate(.42, Positions.UI_FIRST_ROW, .16, Positions.UI_BUTTON_HEIGHT), 'Resume', 'p'))
			.bubble('click', this, 'resume');
		this.add(new UiButton(new Coordinate(.42, Positions.UI_FIRST_ROW + Positions.UI_ROW_HEIGHT, .16, Positions.UI_BUTTON_HEIGHT), 'End encounter', 'escape'))
			.bubble('click', this, 'end-encounter');
	}
}

export default PauseUi;
