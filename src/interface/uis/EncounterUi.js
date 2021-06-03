import MapGeneratorSurvival from '../../map/MapGeneratorSurvival.js';
import MapGeneratorTimed from '../../map/MapGeneratorTimed.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import UiTextArea from '../components/UiTextArea.js';
import Ui from './Ui.js';

class EncounterUi extends Ui {
	constructor() {
		// todo [high] takes up (0, .1) to (1, 1)
		super();
		this.add(new UiText(.5, .15, 'Select Encounter'));
		let descriptionText = this.add(new UiTextArea(.11, .51, .78, .32, ''));
		EncounterUi.Encounters.forEach(({name, description, MapGeneratorClass}, i) => {
			let button = this.add(new UiButton(.42, .2 + .05 * i, .16, .02, name));
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
		}]
	}
}

export default EncounterUi;
