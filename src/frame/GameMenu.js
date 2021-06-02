import EncounterUi from '../interface/uis/EncounterUi.js';
import EquipmentUi from '../interface/uis/EquipmentUi.js';
import PauseUi from '../interface/uis/PauseUi.js';
import SkillsUi from '../interface/uis/SkillsUi.js';
import StatsUi from '../interface/uis/StatsUi.js';
import Frame from './Frame.js';

class GameMenu extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.pauseUi = new PauseUi();
		this.pauseUi.bubble('resume', this);
		this.pauseUi.on('abandon-encounter', () => this.currentUi = this.encounterUi);
		this.encounterUi = new EncounterUi();
		this.encounterUi.bubble('begin-encounter', this);
		this.skillsUi = new SkillsUi();
		this.equipmentUi = new EquipmentUi();
		this.statsUi = new StatsUi();
		[this.encounterUi, this.skillsUi, this.equipmentUi, this.statsUi].forEach(ui =>
			ui.on('select-ui', label => this.currentUi = this[`${label}Ui`]));
		this.currentUi = this.encounterUi;
	}

	pause() {
		this.currentUi = this.pauseUi;
	}

	update() {
		this.currentUi.update(this.controller);
	}

	paint() {
		this.currentUi.paint(this.painterSet.uiPainter);
	}
}

export default GameMenu;
