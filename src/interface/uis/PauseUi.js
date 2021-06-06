import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class PauseUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.5, .15).align(Coordinate.Aligns.CENTER), 'Paused').setTextOptions({size: '18px'}));
		this.add(new UiButton(new Coordinate(.42, .2, .16, .02), 'Resume', 'p'))
			.bubble('click', this, 'resume');
		this.add(new UiButton(new Coordinate(.42, .25, .16, .02), 'Abandon Encounter'))
			.bubble('click', this, 'abandon-encounter');
	}
}

export default PauseUi;
