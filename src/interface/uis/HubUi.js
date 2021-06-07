import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/Enum.js';
import UiButton from '../components/UiButton.js';
import UiSection from '../components/UiSection.js';
import CharacterUi from './CharacterUi.js';
import EncounterUi from './EncounterUi.js';
import EquipmentUi from './EquipmentUi.js';
import SkillsUi from './SkillsUi.js';
import StatsUi from './StatsUi.js';
import Ui from './Ui.js';

const UI_PLACEMENT = makeEnum({FULL: 0, LEFT: 0, RIGHT: 0});

class UiSet {
	constructor(title, uis, index) {
		let width = .1;
		this.button = new UiButton(new Coordinate(Positions.MARGIN + (width + Positions.MARGIN) * index, Positions.MARGIN, width, .03), title);
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
			uiSet.button.on('click', () => this.setActiveUiSet(uiSet));
		});

		this.setActiveUiSet(this.uiSets[0]);
	}

	static createSection(text, placement = UI_PLACEMENT.FULL) {
		const OUTER_MARGIN = Positions.MARGIN;
		const COLUMN_MARGIN = .05;
		const TOP_SHIFT = .08;
		let left = placement === UI_PLACEMENT.RIGHT ? .5 + COLUMN_MARGIN / 2 : OUTER_MARGIN;
		let top = Positions.MARGIN + .03 + TOP_SHIFT;
		let width = placement === UI_PLACEMENT.FULL ? 1 - OUTER_MARGIN * 2 : .5 - OUTER_MARGIN - COLUMN_MARGIN / 2;
		return new UiSection(new Coordinate(left, top, width, 1 - top - OUTER_MARGIN), text,  placement !== UI_PLACEMENT.FULL).setTextOptions({size: '18px'});
	}

	setActiveUiSet(uiSet) {
		this.uiSets
			.filter(uiSetI => uiSetI !== uiSet)
			.forEach(uiSetI => uiSetI.setActive(false));
		uiSet.setActive(true);
	}
}

HubUi.UI_PLACEMENT = UI_PLACEMENT;

export default HubUi;
