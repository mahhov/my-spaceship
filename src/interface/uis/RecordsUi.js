import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import ListLayout from '../layouts/ListLayout.js';
import Ui from './Ui.js';

class RecordsUi extends Ui {
	constructor(recordsData) {
		super();
		this.recordsData = recordsData;
		let layout = new ListLayout(new Coordinate(.4, Positions.UI_FIRST_ROW, .2, 0), Positions.UI_ROW_HEIGHT);
		this.valueTexts = recordsData.records.map((record, i) => {
			let coordinates = layout.getCoordinates(i);
			this.add(new UiText(coordinates.container, `${record.name}`));
			return this.add(new UiText(coordinates.right));
		});
		recordsData.on('change', () => this.refresh());
		this.refresh();
	}

	refresh() {
		this.valueTexts.forEach((valueText, i) =>
			valueText.text = this.recordsData.records[i].value);
	}
}

export default RecordsUi;
