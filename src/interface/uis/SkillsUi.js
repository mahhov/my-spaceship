import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class SkillsUi extends Ui {
	constructor(skillsData) {
		super();
		let sectionCoordinate = this.add(HubUi.createSection('Skills', HubUi.UI_PLACEMENT.RIGHT)).coordinate;

		let horizMargin = Positions.MARGIN * 2, vertMargin = Positions.MARGIN * 1.5;
		let columns = 3, width = (sectionCoordinate.width - horizMargin) / columns;
		skillsData.skillItems.forEach((skillItem, i) => {
			let topLine = sectionCoordinate.clone
				.alignWithoutMove(Coordinate.Aligns.START)
				.size(width - horizMargin, Positions.UI_LINE_HEIGHT)
				.move(
					horizMargin + width * (i % columns),
					Positions.MARGIN + (Positions.UI_LINE_HEIGHT * 2 + vertMargin) * Math.floor(i / columns))
				.alignWithoutMove(Coordinate.Aligns.CENTER);
			let bottomLine = topLine.clone
				.shift(0, 1.2);
			let buttonLine = bottomLine.clone.pad(.01, 0);

			this.add(new UiText(topLine.alignWithoutMove(Coordinate.Aligns.CENTER), skillItem.name));
			this.add(new UiText(bottomLine, skillItem.valueText));
			this.add(new UiButton(
				buttonLine.clone
					.alignWithoutMove(Coordinate.Aligns.START, Coordinate.Aligns.CENTER)
					.size(.015),
				'-'));
			this.add(new UiButton(
				buttonLine.clone
					.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER)
					.size(.015),
				'+'));
		});
	}
}

export default SkillsUi;
