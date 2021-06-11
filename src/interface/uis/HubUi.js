import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import makeEnum from '../../util/enum.js';
import UiButton from '../components/UiButton.js';
import UiSection from '../components/UiSection.js';
import UiText from '../components/UiText.js';
import CharacterUi from './CharacterUi.js';
import EncounterUi from './EncounterUi.js';
import EquipmentUi from './EquipmentUi.js';
import RecordsUi from './RecordsUi.js';
import TechniquesTreeUi from './TechniquesTreeUi.js';
import TechniquesUi from './TechniquesUi.js';
import TraitsUi from './TraitsUi.js';
import Ui from './Ui.js';

const UI_PLACEMENT = makeEnum({FULL: 0, LEFT: 0, RIGHT: 0});

class UiSet {
	constructor(buttonText, title, uis, index) {
		let width = .1;
		this.button = new UiButton(
			new Coordinate(Positions.MARGIN + (width + Positions.MARGIN / 2) * index, Positions.MARGIN, width, Positions.UI_BUTTON_HEIGHT),
			buttonText, index + 1);
		this.title = HubUi.createTitle(title);
		this.uis = [...uis];
	}

	setActive(active) {
		this.button.disabled = active;
		this.title.visible = active;
		this.uis.forEach(ui => ui.visible = active);
	}
}

class HubUi extends Ui {
	constructor(playerData) {
		super();

		this.encounterUi = this.add(new EncounterUi());
		// todo [high] flush these out
		this.encounterUi.bubble('begin-encounter', this);
		this.techniquesTreeUi = this.add(new TechniquesTreeUi());
		this.techniquesUi = this.add(new TechniquesUi());
		this.characterUi = this.add(new CharacterUi(playerData.expData, playerData.traitsData));
		this.traitsUi = this.add(new TraitsUi(playerData.traitsData));
		this.equipmentUi = this.add(new EquipmentUi());
		this.RecordsUi = this.add(new RecordsUi(playerData.recordsData));

		this.uiSets = [
			['Encounters', 'Select encounter', [this.encounterUi]],
			['Techniques', 'Evolve techniques', [this.techniquesTreeUi, this.techniquesUi]],
			['Traits', 'Allocate traits', [this.characterUi, this.traitsUi]],
			['Equipment', 'Craft equipment', [this.characterUi, this.equipmentUi]],
			['Records', 'Recorded stats', [this.RecordsUi]],
		].map((a, i) => new UiSet(...a, i));

		this.uiSets.forEach(uiSet => {
			this.add(uiSet.button);
			this.add(uiSet.title);
			uiSet.button.on('click', () => this.setActiveUiSet(uiSet));
		});

		this.setActiveUiSet(this.uiSets[0]);
	}

	static createTitle(text) {
		return new UiText(new Coordinate(.5, .14).align(Coordinate.Aligns.CENTER), text).setTextOptions({size: '22px'});
	}

	static createSection(text, placement = UI_PLACEMENT.FULL) {
		const OUTER_MARGIN = Positions.MARGIN;
		const COLUMN_MARGIN = .05;
		let left = placement === UI_PLACEMENT.RIGHT ? .5 + COLUMN_MARGIN / 2 : OUTER_MARGIN;
		let width = placement === UI_PLACEMENT.FULL ? 1 - OUTER_MARGIN * 2 : .5 - OUTER_MARGIN - COLUMN_MARGIN / 2;
		return new UiSection(new Coordinate(left, Positions.UI_FIRST_ROW, width, 1 - Positions.UI_FIRST_ROW - OUTER_MARGIN), text);
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
