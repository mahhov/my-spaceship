import HubUi from './HubUi.js';
import Ui from './Ui.js';

class EquipmentUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Equipment', false, .7));
	}
}

export default EquipmentUi;
