import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class Layout {
	constructor(coordinate, columns, horizMargin = Positions.MARGIN, vertMargin = Positions.MARGIN * 1.5) {
		this.innerCoordinate = coordinate.clone.pad(Positions.MARGIN);
		this.horizMargin = horizMargin;
		this.vertMargin = vertMargin;
		this.columns = columns;
		this.width = (this.innerCoordinate.width + this.horizMargin) / this.columns;
	}

	getRow(i) {
		return Math.floor(i / this.columns);
	}

	getCoordinates(i) {
		const buttonSize = 0.015, bottomLineSpacing = 1.2;
		let container = this.innerCoordinate.clone
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
			.size(buttonSize);
		let buttonRight = buttonLine.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER)
			.size(buttonSize);
		return {container, topLine, bottomLine, buttonLeft, buttonRight};
	}
}

class SkillsUi extends Ui {
	constructor(skillsData) {
		super();
		let layout = new Layout(this.add(HubUi.createSection('Skills', HubUi.UI_PLACEMENT.RIGHT)).coordinate, 4);
		skillsData.skillItems.forEach((skillItem, i) => {
			let coordinates = layout.getCoordinates(i);
			this.add(new UiButton(coordinates.container, '', '', true))
				.on('hover', () => this.descriptionText.text = skillItem.description);
			this.add(new UiText(coordinates.topLine, skillItem.name));
			this.add(new UiText(coordinates.bottomLine, skillItem.valueText));
			this.add(new UiButton(coordinates.buttonLeft, '-'));
			this.add(new UiButton(coordinates.buttonRight, '+'));
		});

		let coordinates = layout.getCoordinates(layout.getRow(skillsData.skillItems.length - 1) * layout.columns);
		let bottomTextCoordinate = coordinates.bottomLine.clone.alignWithoutMove(Coordinate.Aligns.START).move(0, 0.015 + Positions.UI_ROW_HEIGHT);
		this.add(new UiText(bottomTextCoordinate, 'Available skill points: 4'));
		this.descriptionText = this.add(new UiText(bottomTextCoordinate.clone.move(0, Positions.UI_ROW_HEIGHT), ''));

		// todo [high] allocate skills on click
	}
}

export default SkillsUi;
