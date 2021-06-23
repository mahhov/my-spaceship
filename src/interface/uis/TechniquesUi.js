import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiOutline from '../components/UiOutline.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import AllocationUi from './AllocationUi.js';
import TabsUi from './TabsUi.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor(techniqueData) {
		super();
		this.techniqueData = techniqueData;

		let coordinate = new Coordinate(0, Positions.UI_FIRST_ROW, 1, Positions.UI_BUTTON_HEIGHT)
			.pad(Positions.MARGIN, 0);
		let tabsUi = this.add(new TabsUi(coordinate.clone, techniqueData.trees.map(tree => tree.name)));

		this.availableText = this.add(new UiText(coordinate.clone.alignWithoutMove(Coordinate.Aligns.END)));

		coordinate
			.shift(0, 1)
			.move(0, Positions.BREAK)
			.size(coordinate.width, 1 - coordinate.top - Positions.MARGIN);
		this.add(new UiOutline(coordinate.clone));

		let hoverText = new UiPopupText(new Coordinate(0, 0, .22));

		coordinate.pad(Positions.MARGIN);
		let treeLayout = GridLayout.createWithFixedColumnWidth(coordinate, 4, AllocationUi.width, AllocationUi.height, Positions.MARGIN, Positions.MARGIN * 2.5);
		this.allocationUiSets = tabsUi.uiSets = techniqueData.trees.map(tree =>
			tree.allocationSets.flatMap((allocations, setIndex) =>
				allocations.flatMap((allocation, allocationIndex) =>
					this.add(AllocationUi.createAndBindAllocationUi(
						treeLayout.getCoordinatesRowColumn(setIndex, allocationIndex).container,
						allocation, techniqueData, hoverText)))));

		this.add(hoverText);

		techniqueData.on('change', () => this.refresh());
		this.refresh();
	}

	refresh() {
		this.allocationUiSets.forEach(allocationUis => allocationUis.forEach(allocationUi => allocationUi.updateValueText()));
		this.availableText.text = this.techniqueData.availableText;
	}
}

export default TechniquesUi;
