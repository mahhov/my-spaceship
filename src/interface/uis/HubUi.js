import {Positions} from '../../util/constants.js';
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

class Tab {
	constructor(buttonText, titleText, uis) {
		this.buttonText = buttonText;
		this.title = new UiText(new Coordinate(.5, .14).align(Coordinate.Aligns.CENTER), titleText)
			.setTextOptions({size: '22px'});
		this.uis = [this.title, ...uis];
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

		let tabs = [
			new Tab('Encounters', 'Select encounter', [this.encounterUi]),
			new Tab('Techniques', 'Refine techniques', [this.techniquesUi]),
			new Tab('Traits', 'Allocate traits', [this.characterUi, this.traitsUi]),
			new Tab('Equipment', 'Craft equipment', [this.characterUi, this.equipmentUi]),
			new Tab('Records', 'Recorded stats', [this.RecordsUi]),
		];
		tabs.forEach(tabData => this.add(tabData.title));
		this.add(new TabsUi(new Coordinate(Positions.MARGIN, Positions.MARGIN, 0, Positions.UI_BUTTON_HEIGHT),
			tabs.map(tab => tab.buttonText), tabs.map(tab => tab.uis), true));
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
}

export default HubUi;
