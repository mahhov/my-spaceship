import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class StatsUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(.5, .15, 'Stats'));
		this.add(new UiText(42, .2, 'Kills'));
		this.add(new UiText(42, .25, 'Time played'));
	}
}

export default StatsUi;
