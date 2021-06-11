import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import ListUiLayout from './layouts/ListUiLayout.js';
import Ui from './Ui.js';

class RecordsUi extends Ui {
	constructor(recordsData) {
		super();
		let layout = new ListUiLayout(new Coordinate(.4, Positions.UI_FIRST_ROW, .2, 0), Positions.UI_ROW_HEIGHT);
		let valueTexts = recordsData.recordItems.map((recordItem, i) => {
			let coordinates = layout.getCoordinates(i);
			this.add(new UiText(coordinates.container, `${recordItem.name}...`));
			let valueText = this.add(new UiText(coordinates.right, recordItem.value));
			return [valueText, recordItem];
		});
		recordsData.on('change', () =>
			valueTexts.forEach(([valueText, traitItem]) =>
				valueText.text = traitItem.value));
	}
}

export default RecordsUi;
