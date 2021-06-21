import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiSection from '../components/UiSection.js';
import UiText from '../components/UiText.js';
import AllocationUi from './AllocationUi.js';
import GridLayout from './layouts/GridLayout.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor(techniqueData) {
		// todo [high] flush out and wire in
		super();
		let innerCoordinate = new Coordinate(0, Positions.UI_FIRST_ROW, 1, Positions.UI_LINE_HEIGHT + Positions.MARGIN)
			.pad(Positions.MARGIN, 0);

		let availableText = this.add(new UiText(innerCoordinate, techniqueData.availableText));

		let treesCoordinate = innerCoordinate.clone.shift(0, 1).pad(.3, 0);
		let treesLayout = new GridLayout(treesCoordinate, 1, 1 - treesCoordinate.top - Positions.MARGIN);
		techniqueData.trees.forEach((tree, treeIndex) => {
			let {container} = treesLayout.getCoordinates(treeIndex);
			this.add(new UiSection(container.clone, tree.name));
			let treeLayout = new GridLayout(container.pad(Positions.MARGIN), 3, AllocationUi.height);
			tree.allocationSets.forEach((set, setIndex) => {
				set.forEach((allocation, allocationIndex) => {
					let coordinates = treeLayout.getCoordinatesRowColumn(setIndex, allocationIndex);
					this.add(new AllocationUi(coordinates.container, allocation));
				});
			});
		});
	}
}

export default TechniquesUi;
