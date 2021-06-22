import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import ListLayout from '../layouts/ListLayout.js';
import Ui from './Ui.js';

class RecordsUi extends Ui {
	constructor(recordsData) {
		super();
		let layout = new ListLayout(new Coordinate(.4, Positions.UI_FIRST_ROW, .2, 0), Positions.UI_ROW_HEIGHT);
		let valueTexts = recordsData.records.map((record, i) => {
			let coordinates = layout.getCoordinates(i);
			this.add(new UiText(coordinates.container, `${record.name}`));
			let valueText = this.add(new UiText(coordinates.right, record.value));
			return [valueText, record];
		});
		recordsData.on('change', () =>
			valueTexts.forEach(([valueText, record]) =>
				valueText.text = record.value));
	}
}

export default RecordsUi;
