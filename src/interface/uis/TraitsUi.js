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
		let section = this.add(HubUi.createSection('Traits', false, .7));
		let innerCoordinate = section.coordinate.clone.pad(Positions.MARGIN).alignWithoutMove(Coordinate.Aligns.START);

		let availableText = this.add(new UiText(innerCoordinate, traitsData.availableText));

		let layout = new GridLayout(innerCoordinate.clone.move(0, Positions.UI_LINE_HEIGHT + Positions.MARGIN), 6, AllocationUi.height);
		let allocationButtons = traitsData.allocations.map((allocation, i) => {
			let {container} = layout.getCoordinates(i);
			let allocationButton = this.add(new AllocationUi(container, allocation));
			allocationButton.on('hover', () => this.descriptionText.beginHover(allocationButton.bounds, allocation.descriptionText));
			allocationButton.on('decrease', () => traitsData.allocate(allocation, -1));
			allocationButton.on('increase', () => traitsData.allocate(allocation, 1));
			return [allocationButton, allocation];
		});

		this.descriptionText = this.add(new UiPopupText(new Coordinate(0, 0, .22)));

		traitsData.on('change', () => {
			allocationButtons.forEach(([allocationButton, allocation]) =>
				allocationButton.value = allocation.valueText);
			availableText.text = traitsData.availableText;
		});
	}
}

export default TraitsUi;
