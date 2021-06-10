import HubUi from './HubUi.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Equipped techniques', HubUi.UI_PLACEMENT.RIGHT));
	}
}

export default TechniquesUi;
