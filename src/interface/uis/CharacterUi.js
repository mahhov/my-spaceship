import {Positions} from '../../util/constants.js';
import UiText from '../components/UiText.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class CharacterUi extends Ui {
	constructor(expData, traitsData) {
		super();
		let section = this.add(HubUi.createSection('Character', true, .3));

		let coordinate = section.coordinate.clone.pad(Positions.MARGIN);
		let levelText = this.add(new UiText(coordinate, expData.levelText));
		let expText = this.add(new UiText(coordinate.clone.move(0, Positions.UI_LINE_HEIGHT), expData.expText));

		expData.on('change', () => {
			levelText.text = expData.levelText;
			expText.text = expData.expText;
		});
	}
}

export default CharacterUi;
