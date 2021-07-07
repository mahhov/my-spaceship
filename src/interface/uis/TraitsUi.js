import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import HubUi from './HubUi.js';
import IconAllocationUi from './IconAllocationUi.js';
import Ui from './Ui.js';

class TraitsUi extends Ui {
	constructor(traitsData) {
		super();
		this.traitsData = traitsData;
		let section = this.add(HubUi.createSection('Traits', false, .7));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN).alignWithoutMove(Coordinate.Aligns.START);

		this.availableText = this.add(new UiText(innerCoordinate));

		let hoverText = new UiPopupText(new Coordinate(0, 0, .22));

		let layout = GridLayout.createWithSquares(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 5, Positions.MARGIN * 2, Positions.MARGIN * 2);
		this.allocationUis = traitsData.allocations.map((allocation, i) =>
			this.add(
				new IconAllocationUi(layout.getCoordinates(i).container, allocation)
					.bind(traitsData, hoverText)));

		this.add(hoverText);

		traitsData.on('change', () => this.refresh());
		this.refresh();
	}

	refresh() {
		this.allocationUis.forEach(iconAllocationUi => iconAllocationUi.refreshValue());
		this.availableText.text = this.traitsData.availableText;
	}
}

export default TraitsUi;
