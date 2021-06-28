import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class PauseUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.5, .15).align(Coordinate.Aligns.CENTER), 'Paused').setTextOptions({size: '22px'}));
		let resumeButton = this.add(new UiButton(new Coordinate(.42, Positions.UI_FIRST_ROW, .16, Positions.UI_BUTTON_HEIGHT), 'Resume', 'p'));
		this.bubble(resumeButton, 'click', 'resume');
		let endButton = this.add(new UiButton(new Coordinate(.42, Positions.UI_FIRST_ROW + Positions.UI_ROW_HEIGHT, .16, Positions.UI_BUTTON_HEIGHT), 'End encounter', 'escape'));
		this.bubble(endButton, 'click', 'end-encounter');
	}
}

export default PauseUi;
