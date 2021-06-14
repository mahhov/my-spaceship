import {Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
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

class UiSet {
	constructor(buttonText, title, uis, index) {
		let buttonWidth = .1;
		this.button = new UiButton(
			new Coordinate(
				Positions.MARGIN + (buttonWidth + Positions.MARGIN / 2) * index,
				Positions.MARGIN,
				buttonWidth,
				Positions.UI_BUTTON_HEIGHT),
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
		this.characterUi = this.add(new CharacterUi(playerData, playerData.expData, playerData.traitsData));
		this.traitsUi = this.add(new TraitsUi(playerData.traitsData));
		this.equipmentUi = this.add(new EquipmentUi(playerData.equipmentData));
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

	setActiveUiSet(uiSet) {
		this.uiSets
			.filter(uiSetI => uiSetI !== uiSet)
			.forEach(uiSetI => uiSetI.setActive(false));
		uiSet.setActive(true);
	}
}

export default HubUi;
