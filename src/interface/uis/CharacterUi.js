import {Positions} from '../../util/constants.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class CharacterUi extends Ui {
	constructor(traitsData) {
		super();
		let section = this.add(HubUi.createSection('Character', HubUi.UI_PLACEMENT.LEFT));

		let coordinate = section.coordinate.clone.pad(Positions.MARGIN);
		let levelText = this.add(new UiText(coordinate, traitsData.levelText));
		let expText = this.add(new UiText(coordinate.clone.move(0, Positions.UI_LINE_HEIGHT), traitsData.expText));

		traitsData.on('change', () => {
			levelText.text = traitsData.levelText;
			expText.text = traitsData.expText;
		});
	}
}

export default CharacterUi;
