import MapGeneratorStaged from '../../map/MapGeneratorStaged.js';
import MapGeneratorTimed from '../../map/MapGeneratorTimed.js';
import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiPopupText from '../components/UiPopupText.js';
import ListLayout from '../layouts/ListLayout.js';
import Ui from './Ui.js';

class EncounterUi extends Ui {
	constructor(encounterData) {
		super();
		let layout = new ListLayout(new Coordinate(.42, Positions.UI_FIRST_ROW, .16), Positions.UI_BUTTON_HEIGHT, Positions.UI_ROW_HEIGHT - Positions.UI_BUTTON_HEIGHT);
		EncounterUi.Encounters.forEach(({name, description, MapGeneratorClass}, i) => {
			let button = this.add(new UiButton(layout.getCoordinates(i).container, name));
			button.on('hover', () => hoverText.beginHover(button.bounds, [description]));
			button.on('click', () => this.emit('begin-encounter', MapGeneratorClass));
		});
		let hoverText = this.add(new UiPopupText(new Coordinate(0, 0, .3, .058), true)); // .058 just works nicely with 3 lines of text
	}

	static get Encounters() {
		return [{
			name: 'Endless',
			MapGeneratorClass: MapGeneratorTimed,
			description: 'Continuous spawn of monsters of increasing difficulty and frequency.',
		}, {
			name: 'Waves',
			MapGeneratorClass: MapGeneratorStaged,
			description: 'Fight 5 waves of monsters.',
		}];
	}
}

export default EncounterUi;
