import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import ListUiLayout from './layouts/ListUiLayout.js';
import Ui from './Ui.js';

class StatsUi extends Ui {
	constructor() {
		super();
		let layout = new ListUiLayout(new Coordinate(.4, Positions.UI_FIRST_ROW, .2, 0), Positions.UI_ROW_HEIGHT);

		this.add(new UiText(layout.getContainerCoordinate(0), 'Kills...'));
		this.add(new UiText(layout.getContainerCoordinate(0).alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START), '00000'));
		this.add(new UiText(layout.getContainerCoordinate(1), 'Time played...'));
		this.add(new UiText(layout.getContainerCoordinate(1).alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START), '0'));
	}
}

export default StatsUi;
