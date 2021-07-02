import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiLine from '../components/UiLine.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import ListLayout from '../layouts/ListLayout.js';
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

		let hoverText = new UiPopupText(new Coordinate(0, 0, .3));

		coordinate
			.shift(0, 1)
			.move(0, Positions.BREAK)
			.size(coordinate.width, 1 - coordinate.top - Positions.MARGIN)
			.alignWithoutMove(Coordinate.Aligns.CENTER);
		const vertMarginMult = 2.5;
		let trees = techniqueData.trees.map(tree => {
			coordinate.size(GridLayout.totalWidth(3, AllocationUi.width, Positions.MARGIN), GridLayout.totalWidth(tree.allocationSets.length, AllocationUi.height, Positions.MARGIN * vertMarginMult));
			let setsLayout = new ListLayout(coordinate.clone, AllocationUi.height, Positions.MARGIN * vertMarginMult);
			return tree.allocationSets.map((allocations, setIndex) => {
				let setCoordinate = setsLayout.getCoordinates(setIndex).container;
				let allocationsLayout = GridLayout.createWithFixedColumnWidth(setCoordinate.clone, 3, AllocationUi.width * 1.5, AllocationUi.height, Positions.MARGIN);
				let lineUi = setIndex && this.add(new UiLine(setCoordinate.size(allocationsLayout.totalWidth, 0).move(0, -Positions.MARGIN * vertMarginMult / 2)));
				let allocationUis = allocations.map((allocation, allocationIndex) =>
					// todo [high] some indication of which allocation is selected
					this.add(
						new AllocationUi(allocationsLayout.getCoordinates(allocationIndex).container, allocation, true)
							.bind(techniqueData, hoverText)));
				return {lineUi, allocationUis};
			});
		});
		this.allocationUis = trees.flatMap(tree => tree.flatMap(allocationSets => allocationSets.allocationUis));
		tabsUi.uiSets = trees.map(tree => tree.flatMap(allocationSets => [allocationSets.lineUi, ...allocationSets.allocationUis].filter(v => v)));

		this.add(hoverText);

		techniqueData.on('change', () => this.refresh());
		this.refresh();
	}

	refresh() {
		this.allocationUis.forEach(allocationUi => {
			allocationUi.updateValueText();
			allocationUi.updateActive();
		});
		this.availableText.text = this.techniqueData.availableText;
	}
}

export default TechniquesUi;
