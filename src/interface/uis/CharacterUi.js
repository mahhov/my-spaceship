import Stat from '../../playerData/Stat.js';
import {Positions} from '../../util/constants.js';
import {round} from '../../util/number.js';
import UiText from '../components/UiText.js';
import ListLayout from '../layouts/ListLayout.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class CharacterUi extends Ui {
	constructor(playerData, expData, traitsData, equipmentData) {
		super();
		let section = this.add(HubUi.createSection('Character', true, .3));

		this.layout = new ListLayout(section.coordinate.clone.pad(Positions.MARGIN), Positions.UI_LINE_HEIGHT);
		this.levelText = this.addTextPair('Level', 0);
		this.expText = this.addTextPair('Experience', 1);
		this.derivedStatTexts = Object.values(Stat.DerivedStatIds).map(i =>
			this.addTextPair(Stat.derivedStatName(i), i + 3));
		this.statTexts = Object.values(Stat.Ids).map(i =>
			this.addTextPair(Stat.name(i), i + 4 + Object.values(Stat.DerivedStatIds).length));

		expData.on('change', () => this.refresh(playerData, expData));
		traitsData.on('change', () => this.refresh(playerData, expData));
		equipmentData.on('change', () => this.refresh(playerData, expData));
		this.refresh(playerData, expData);
	}

	addTextPair(label, i) {
		let coordinates = this.layout.getCoordinates(i);
		this.add(new UiText(coordinates.container, label));
		return this.add(new UiText(coordinates.right, ''));
	}

	refresh(playerData, expData) {
		this.levelText.text = expData.levelText;
		this.expText.text = expData.expText;

		CharacterUi.getStatValuesForUi(playerData.derivedStatValues, Stat.DerivedStatIds)
			.forEach((value, i) => this.derivedStatTexts[i].text = value);
		CharacterUi.getStatValuesForUi(playerData.statValues, Stat.Ids)
			.forEach((value, i) => this.statTexts[i].text = value);
	}

	static getStatValuesForUi(statValues, statIds) {
		return Object.values(statIds).map(statId => round(statValues.get(statId), 2));
	}
}

export default CharacterUi;
