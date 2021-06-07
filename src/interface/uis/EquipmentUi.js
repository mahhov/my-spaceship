import HubUi from './HubUi.js';
import Ui from './Ui.js';

class EquipmentUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Equipment', HubUi.UI_PLACEMENT.RIGHT));
	}
}

export default EquipmentUi;
