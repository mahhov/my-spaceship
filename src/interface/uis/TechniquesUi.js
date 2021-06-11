import HubUi from './HubUi.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Equipped techniques', false, .5));
	}
}

export default TechniquesUi;
