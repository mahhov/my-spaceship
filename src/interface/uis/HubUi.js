import UiButton from '../components/UiButton.js';
import CharacterUi from './CharacterUi.js';
import EncounterUi from './EncounterUi.js';
import EquipmentUi from './EquipmentUi.js';
import SkillsUi from './SkillsUi.js';
import StatsUi from './StatsUi.js';
import Ui from './Ui.js';

class UiSet {
	constructor(title, uis, index) {
		this.button = new UiButton(.02 + index * .1, .02, .1 - .003, .03, title);
		this.uis = uis;
	}

	setActive(active) {
		this.button.disabled = active;
		this.uis.forEach(ui => ui.visible = active);
	}
}

class HubUi extends Ui {
	constructor() {
		super();

		this.encounterUi = this.add(new EncounterUi());
		this.encounterUi.bubble('begin-encounter', this);
		this.characterUi = this.add(new CharacterUi());
		this.skillsUi = this.add(new SkillsUi());
		this.equipmentUi = this.add(new EquipmentUi());
		this.statsUi = this.add(new StatsUi());

		this.uiSets = [
			['Encounters', [this.encounterUi]],
			['Skills', [this.characterUi, this.skillsUi]],
			['Equipment', [this.characterUi, this.equipmentUi]],
			['Stats', [this.statsUi]],
		].map(([title, uis], i) => new UiSet(title, uis, i));

		this.uiSets.forEach(uiSet => {
			this.add(uiSet.button);
			uiSet.button.on('click', () => this.uiSets.forEach(uiSetI => uiSetI.setActive(uiSetI === uiSet)));
		});

		this.uiSets[0].setActive(true);
	}
}

export default HubUi;
