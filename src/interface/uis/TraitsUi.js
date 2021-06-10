import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

const ALLOCATE_BUTTON_SIZE = 0.015;

class Layout {
	constructor(coordinate, columns, horizMargin = Positions.MARGIN, vertMargin = Positions.MARGIN * 1.5) {
		this.coordinate = coordinate;
		this.horizMargin = horizMargin;
		this.vertMargin = vertMargin;
		this.columns = columns;
		this.width = (this.coordinate.width + this.horizMargin) / this.columns;
	}

	getRow(i) {
		return Math.floor(i / this.columns);
	}

	getCoordinates(i) {
		const bottomLineSpacing = 1.2;
		let container = this.coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(this.width - this.horizMargin, Positions.UI_LINE_HEIGHT * (1 + bottomLineSpacing))
			.move(
				this.width * (i % this.columns),
				(Positions.UI_LINE_HEIGHT * (1 + bottomLineSpacing) + this.vertMargin) * this.getRow(i));
		let topLine = container.clone
			.size(this.width - this.horizMargin, Positions.UI_LINE_HEIGHT)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		let bottomLine = topLine.clone.shift(0, bottomLineSpacing);
		let buttonLine = bottomLine.clone.pad(.01, 0);
		let buttonLeft = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);
		let buttonRight = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER)
			.size(ALLOCATE_BUTTON_SIZE);
		return {container, topLine, bottomLine, buttonLeft, buttonRight};
	}
}

class TraitsUi extends Ui {
	constructor(traitsData) {
		super();
		let section = this.add(HubUi.createSection('Traits', HubUi.UI_PLACEMENT.RIGHT));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN);

		let availableText = this.add(new UiText(innerCoordinate, traitsData.availableText));

		let layout = new Layout(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 4);
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

		let coordinate = layout.getCoordinates(layout.getRow(traitsData.traitItems.length - 1) * layout.columns).bottomLine
			.alignWithoutMove(Coordinate.Aligns.START).move(0, ALLOCATE_BUTTON_SIZE + Positions.UI_ROW_HEIGHT);
		let descriptionText = this.add(new UiText(coordinate, ''));

		traitsData.on('change', () => {
			valueTexts.forEach(([valueText, traitItem]) =>
				valueText.text = traitItem.valueText);
			availableText.text = traitsData.availableText;
		});
	}
}

export default TraitsUi;
