import Ui from './Ui.js';
import UiText from '../components/UiText.js';
import UiButton from '../components/UiButton.js';

class PauseUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(.5, .15, 'Paused'));
		this.add(new UiButton(.42, .2, .16, .02, 'Resume', 'p'))
			.bubble('click', this, 'resume');
		this.add(new UiButton(.42, .25, .16, .02, 'Abandon Hunt'))
			.bubble('click', this, 'abandon-hunt');
	}
}

export default PauseUi;
