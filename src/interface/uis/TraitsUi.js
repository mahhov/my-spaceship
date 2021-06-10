import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import TraitsUiLayout from './layouts/TraitsUiLayout.js';
import Ui from './Ui.js';

class TraitsUi extends Ui {
	constructor(traitsData) {
		super();
		let section = this.add(HubUi.createSection('Traits', HubUi.UI_PLACEMENT.RIGHT));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN);

		let availableText = this.add(new UiText(innerCoordinate, traitsData.availableText));

		let layout = new TraitsUiLayout(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 4);
		let valueTexts = traitsData.traitItems.map((traitItem, i) => {
			let coordinates = layout.getCoordinates(i);

			this.add(new UiButton(coordinates.container, '', '', true))
				.on('hover', () => descriptionText.text = traitItem.description);
			this.add(new UiText(coordinates.topLine, traitItem.name));
			let valueText = this.add(new UiText(coordinates.bottomLine, traitItem.valueText));

			this.add(new UiButton(coordinates.buttonLeft, '-'))
				.on('click', () => traitsData.allocate(traitItem, -1));
			this.add(new UiButton(coordinates.buttonRight, '+'))
				.on('click', () => traitsData.allocate(traitItem, 1));

			return [valueText, traitItem];
		});

		let coordinate = layout.getCoordinates(layout.getRow(traitsData.traitItems.length - 1) * layout.columns).container
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.END)
			.move(0, Positions.UI_ROW_HEIGHT)
			.align(Coordinate.Aligns.START);
		let descriptionText = this.add(new UiText(coordinate, ''));

		traitsData.on('change', () => {
			valueTexts.forEach(([valueText, traitItem]) =>
				valueText.text = traitItem.valueText);
			availableText.text = traitsData.availableText;
		});
	}
}

export default TraitsUi;
