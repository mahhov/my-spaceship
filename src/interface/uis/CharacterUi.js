import HubUi from './HubUi.js';
import Ui from './Ui.js';

class CharacterUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Character', HubUi.UI_PLACEMENT.LEFT));
	}
}

export default CharacterUi;
