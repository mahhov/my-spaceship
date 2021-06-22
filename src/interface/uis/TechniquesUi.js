import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiText from '../components/UiText.js';
import AllocationUi from './AllocationUi.js';
import GridLayout from './layouts/GridLayout.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor(techniqueData) {
		// todo [high] flush out and wire in
		super();
		let coordinate = new Coordinate(0, Positions.UI_FIRST_ROW, 1, Positions.UI_LINE_HEIGHT + Positions.MARGIN)
			.pad(Positions.MARGIN, 0);
		this.add(new UiText(coordinate.clone, techniqueData.availableText));

		coordinate.shift(0, 1);
		let treeButtonsLayout = GridLayout.createWithFixedColumnWidth(coordinate.clone, 4, .2, Positions.UI_BUTTON_HEIGHT, Positions.MARGIN / 2);
		techniqueData.trees.forEach((tree, i) => {
			let {container} = treeButtonsLayout.getCoordinates(i);
			this.add(new UiButton(container, tree.name));
		});

		coordinate
			.move(0, Positions.UI_BUTTON_HEIGHT + Positions.MARGIN * 2)
			.size(coordinate.width, 1 - coordinate.top - Positions.MARGIN);
		let treeLayout = GridLayout.createWithFixedColumnWidth(coordinate, 4, AllocationUi.width, AllocationUi.height, Positions.MARGIN, Positions.MARGIN * 2.5);
		techniqueData.trees[0].allocationSets.forEach((set, setIndex) => {
			set.forEach((allocation, allocationIndex) => {
				this.add(new AllocationUi(treeLayout.getCoordinatesRowColumn(setIndex, allocationIndex).container, allocation));
			});
		});
	}
}

export default TechniquesUi;
