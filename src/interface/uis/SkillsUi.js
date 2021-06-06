import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class SkillsUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.75, .15).align(Coordinate.Aligns.CENTER), 'Skills').setTextOptions({size: '18px'}));
	}
}

export default SkillsUi;
