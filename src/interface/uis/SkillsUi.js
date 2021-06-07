import HubUi from './HubUi.js';
import Ui from './Ui.js';

class SkillsUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Skills', HubUi.UI_PLACEMENT.RIGHT));
	}
}

export default SkillsUi;
