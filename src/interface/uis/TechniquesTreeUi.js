import HubUi from './HubUi.js';
import Ui from './Ui.js';

class TechniquesTreeUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Learn techniques', true, .5));
	}
}

export default TechniquesTreeUi;
