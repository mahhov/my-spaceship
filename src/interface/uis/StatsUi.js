import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class StatsUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Stats'));
		this.add(new UiText(new Coordinate(.4, Positions.UI_FIRST_ROW), 'Kills...'));
		this.add(new UiText(new Coordinate(.6, Positions.UI_FIRST_ROW).align(Coordinate.Aligns.END, Coordinate.Aligns.START), '00000'));
		this.add(new UiText(new Coordinate(.4, Positions.UI_FIRST_ROW + Positions.UI_ROW_HEIGHT), 'Time played...'));
		this.add(new UiText(new Coordinate(.6, Positions.UI_FIRST_ROW + Positions.UI_ROW_HEIGHT).align(Coordinate.Aligns.END, Coordinate.Aligns.START), '0'));
	}
}

export default StatsUi;
