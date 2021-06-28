import MapGeneratorSurvival from '../../map/MapGeneratorSurvival.js';
import MapGeneratorTimed from '../../map/MapGeneratorTimed.js';
import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiTextArea from '../components/UiTextArea.js';
import ListLayout from '../layouts/ListLayout.js';
import Ui from './Ui.js';

class EncounterUi extends Ui {
	constructor() {
		super();
		let descriptionText = this.add(new UiTextArea(new Coordinate(.11, .51, .78, .32), ''));
		let layout = new ListLayout(new Coordinate(.42, Positions.UI_FIRST_ROW, .16), Positions.UI_BUTTON_HEIGHT, Positions.UI_ROW_HEIGHT - Positions.UI_BUTTON_HEIGHT);
		EncounterUi.Encounters.forEach(({name, description, MapGeneratorClass}, i) => {
			let button = this.add(new UiButton(layout.getCoordinates(i).container, name));
			button.on('hover', () => descriptionText.text = description);
			button.on('end-hover', () => {
				if (descriptionText.text === description)
					descriptionText.text = '';
			});
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
