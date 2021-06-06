import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class CharacterUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.25, .15).align(Coordinate.Aligns.CENTER), 'Character').setTextOptions({size: '18px'}));
	}
}

export default CharacterUi;
