import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiSection from '../components/UiSection.js';
import UiText from '../components/UiText.js';
import CharacterUi from './CharacterUi.js';
import EncounterUi from './EncounterUi.js';
import EquipmentUi from './EquipmentUi.js';
import RecordsUi from './RecordsUi.js';
import TabsUi from './TabsUi.js';
import TechniquesUi from './TechniquesUi.js';
import TraitsUi from './TraitsUi.js';
import Ui from './Ui.js';

class UiSet {
	constructor(title, uis) {
		this.title = HubUi.createTitle(title);
		this.uis = [...uis];
	}

	setActive(active) {
		this.title.visible = active;
		this.uis.forEach(ui => ui.visible = active);
	}
}

class HubUi extends Ui {
	constructor(playerData) {
		super();

		this.encounterUi = this.add(new EncounterUi());
		// todo [high] flush these out
		this.bubble(this.encounterUi, 'begin-encounter');
		this.techniquesUi = this.add(new TechniquesUi(playerData.techniqueData));
		this.characterUi = this.add(new CharacterUi(playerData, playerData.expData, playerData.traitsData, playerData.equipmentData));
		this.traitsUi = this.add(new TraitsUi(playerData.traitsData));
		this.equipmentUi = this.add(new EquipmentUi(playerData.equipmentData));
		this.RecordsUi = this.add(new RecordsUi(playerData.recordsData));

		this.uiSets = [
			new UiSet('Select encounter', [this.encounterUi]),
			new UiSet('Refine techniques', [this.techniquesUi]),
			new UiSet('Allocate traits', [this.characterUi, this.traitsUi]),
			new UiSet('Craft equipment', [this.characterUi, this.equipmentUi]),
			new UiSet('Recorded stats', [this.RecordsUi]),
		];

		this.uiSets.forEach(uiSet => this.add(uiSet.title));

		this.add(new TabsUi(new Coordinate(Positions.MARGIN, Positions.MARGIN, .5),
			['Encounters', 'Techniques', 'Traits', 'Equipment', 'Records'], true))
			.on('select', index => this.setActiveUiSet(index));

		this.setActiveUiSet(0);
	}

	static createTitle(text) {
		return new UiText(new Coordinate(.5, .14).align(Coordinate.Aligns.CENTER), text).setTextOptions({size: '22px'});
	}

	static createSection(text, isLeft, widthWeight) {
		return new UiSection(new Coordinate(
			isLeft ? Positions.MARGIN : 1 - Positions.MARGIN,
			Positions.UI_FIRST_ROW,
			1 - 4 * Positions.MARGIN,
			1 - Positions.UI_FIRST_ROW - Positions.MARGIN)
				.align(isLeft ? Coordinate.Aligns.START : Coordinate.Aligns.END, Coordinate.Aligns.START)
				.scale(widthWeight, 1),
			text);
	}

	setActiveUiSet(index) {
		this.uiSets
			.filter((_, i) => i !== index)
			.forEach(uiSet => uiSet.setActive(false));
		this.uiSets[index].setActive(true);
	}
}

export default HubUi;
