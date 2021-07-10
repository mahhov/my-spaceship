import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiLine from '../components/UiLine.js';
import UiPopupText from '../components/UiPopupText.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import ListLayout from '../layouts/ListLayout.js';
import AllocationUi from './AllocationUi.js';
import HubUi from './HubUi.js';
import TabsUi from './TabsUi.js';
import Ui from './Ui.js';

// todo [medium] re-style allocation uis to be similar to trait uis. e.g. n/n in bottom right

class TechniquesUi extends Ui {
	constructor(techniqueData) {
		super();
		this.techniqueData = techniqueData;

		// todo rename all 'hoverText' to 'hoverPopup' for consistency
		let hoverText = new UiPopupText(new Coordinate(0, 0, .3));

		let leftCoordinate = HubUi.createSectionCoordinate(true, .3)
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(Positions.UI_BUTTON_HEIGHT * 2);
		let tabsUi = this.add(TabsUi.createWithIconButtons(
			leftCoordinate,
			techniqueData.trees.map(tree => `../../images/techniques/${tree.imageName}`),
			false,
			true,
		));
		tabsUi.buttons.forEach((button, i) => button.on('hover', () =>
			hoverText.beginHover(button.bounds, [techniqueData.trees[i].name])));

		this.availableText = this.add(new UiText(tabsUi.nextCoordinate.clone.move(0, Positions.MARGIN)));

		let rightCoordinate = HubUi.createSectionCoordinate(false, .7);
		const vertMarginMult = 2.5;
		let trees = techniqueData.trees.map(tree => {
			let setsLayout = new ListLayout(rightCoordinate.clone, AllocationUi.height, Positions.MARGIN * vertMarginMult);
			return tree.allocationSets.map((allocations, setIndex) => {
				let setCoordinate = setsLayout.getCoordinates(setIndex).container;
				let allocationsLayout = GridLayout.createWithFixedColumnWidth(setCoordinate.clone, 3, AllocationUi.width * 1.5, AllocationUi.height, Positions.MARGIN);
				let lineUi = setIndex && this.add(new UiLine(setCoordinate.size(allocationsLayout.totalWidth, 0).move(0, -Positions.MARGIN * vertMarginMult / 2)));
				let allocationUis = allocations.map((allocation, allocationIndex) =>
					this.add(
						new AllocationUi(allocationsLayout.getCoordinates(allocationIndex).container, allocation, true)
							.bind(techniqueData, hoverText)));
				return {lineUi, allocationUis};
			});
		});
		this.allocationUis = trees.flatMap(tree => tree.flatMap(allocationSets => allocationSets.allocationUis));
		tabsUi.setUiSets(trees.map(tree => tree.flatMap(allocationSets => [allocationSets.lineUi, ...allocationSets.allocationUis].filter(v => v))));

		this.add(hoverText);

		techniqueData.on('change', () => this.refresh());
		this.refresh();
	}

	refresh() {
		this.allocationUis.forEach(allocationUi => allocationUi.refreshValue());
		this.availableText.text = this.techniqueData.availableText;
	}
}

export default TechniquesUi;
