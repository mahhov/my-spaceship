import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import AllocationUi from './AllocationUi.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class TraitsUi extends Ui {
	constructor(traitsData) {
		super();
		this.traitsData = traitsData;
		let section = this.add(HubUi.createSection('Traits', false, .7));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN).alignWithoutMove(Coordinate.Aligns.START);

		this.availableText = this.add(new UiText(innerCoordinate, ''));

		let layout = new GridLayout(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 6, AllocationUi.height);
		this.allocationUis = traitsData.allocations.map((allocation, i) => {
			let {container} = layout.getCoordinates(i);
			let allocationUi = this.add(new AllocationUi(container, allocation));
			allocationUi.on('hover', () => this.descriptionText.beginHover(allocationUi.bounds, allocation.descriptionText));
			allocationUi.on('decrease', () => traitsData.allocate(allocation, -1));
			allocationUi.on('increase', () => traitsData.allocate(allocation, 1));
			return allocationUi;
		});

		this.descriptionText = this.add(new UiPopupText(new Coordinate(0, 0, .22)));

		traitsData.on('change', () => this.updateTraitsData());
		this.updateTraitsData();
	}

	updateTraitsData() {
		this.allocationUis.forEach(allocationUi => allocationUi.updateValueText());
		this.availableText.text = this.traitsData.availableText;
	}
}

export default TraitsUi;
