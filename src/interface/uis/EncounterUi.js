import MapGeneratorSurvival from '../../map/MapGeneratorSurvival.js';
import MapGeneratorTimed from '../../map/MapGeneratorTimed.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiTextArea from '../components/UiTextArea.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class EncounterUi extends Ui {
	constructor() {
		super();
		this.add(HubUi.createSection('Encounter'));
		let descriptionText = this.add(new UiTextArea(new Coordinate(.11, .51, .78, .32), ''));
		EncounterUi.Encounters.forEach(({name, description, MapGeneratorClass}, i) => {
			let button = this.add(new UiButton(new Coordinate(.42, .2 + .05 * i, .16, .02), name));
			button.on('hover', () => descriptionText.text = description);
			button.on('click', () => this.emit('begin-encounter', MapGeneratorClass));
		});
	}

	static get Encounters() {
		return [{
			name: 'Scavenge',
			MapGeneratorClass: MapGeneratorTimed,
			description: 'Scavenge encounter keys.',
		}, {
			name: 'Survival',
			MapGeneratorClass: MapGeneratorSurvival,
			description: 'Survive endless monsters in the arena. Good source of metal.',
		}, {
			name: 'Exterminate',
			MapGeneratorClass: MapGeneratorSurvival,
			description: 'Exterminate monsters to obtain hunt keys.',
		}, {
			name: 'Hunt',
			MapGeneratorClass: MapGeneratorSurvival,
			description: 'Hunt a powerful monster for crafting orbs.',
		}];
	}
}

export default EncounterUi;