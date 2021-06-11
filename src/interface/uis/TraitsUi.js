import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import TraitsUiLayout from './layouts/TraitsUiLayout.js';
import Ui from './Ui.js';

class TraitsUi extends Ui {
	constructor(traitsData) {
		super();
		let section = this.add(HubUi.createSection('Traits', false, .7));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN).alignWithoutMove(Coordinate.Aligns.START);

		let availableText = this.add(new UiText(innerCoordinate, traitsData.availableText));

		let layout = new TraitsUiLayout(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 6);
		let valueTexts = traitsData.traitItems.map((traitItem, i) => {
			let coordinates = layout.getCoordinates(i);

			let containerButton = new UiButton(coordinates.container, '', '', true);
			this.add(containerButton).on('hover', () => {
				this.descriptionText.hoverBounds = containerButton.bounds;
				this.descriptionText.text = traitItem.description;
			});
			this.add(new UiText(coordinates.topLine, traitItem.name));
			let valueText = this.add(new UiText(coordinates.bottomLine, traitItem.valueText));

			this.add(new UiButton(coordinates.buttonLeft, '-'))
				.on('click', () => traitsData.allocate(traitItem, -1));
			this.add(new UiButton(coordinates.buttonRight, '+'))
				.on('click', () => traitsData.allocate(traitItem, 1));

			return [valueText, traitItem];
		});

		this.descriptionText = this.add(new UiPopupText(new Coordinate(0, 0, .22, Positions.UI_LINE_HEIGHT + Positions.BREAK * 2)));

		traitsData.on('change', () => {
			valueTexts.forEach(([valueText, traitItem]) =>
				valueText.text = traitItem.valueText);
			availableText.text = traitsData.availableText;
		});
	}
}

export default TraitsUi;
