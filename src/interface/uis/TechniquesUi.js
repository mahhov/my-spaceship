import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiOutline from '../components/UiOutline.js';
import UiText from '../components/UiText.js';
import GridLayout from '../layouts/GridLayout.js';
import AllocationUi from './AllocationUi.js';
import TabsUi from './TabsUi.js';
import Ui from './Ui.js';

class TechniquesUi extends Ui {
	constructor(techniqueData) {
		super();

		let coordinate = new Coordinate(0, Positions.UI_FIRST_ROW, 1, Positions.UI_BUTTON_HEIGHT)
			.pad(Positions.MARGIN, 0);
		this.add(new TabsUi(coordinate.clone, techniqueData.trees.map(tree => tree.name)));

		this.add(new UiText(coordinate.clone.alignWithoutMove(Coordinate.Aligns.END), techniqueData.availableText));

		coordinate
			.shift(0, 1)
			.move(0, Positions.BREAK)
			.size(coordinate.width, 1 - coordinate.top - Positions.MARGIN);
		this.add(new UiOutline(coordinate.clone));

		coordinate.pad(Positions.MARGIN);
		let treeLayout = GridLayout.createWithFixedColumnWidth(coordinate, 4, AllocationUi.width, AllocationUi.height, Positions.MARGIN, Positions.MARGIN * 2.5);
		techniqueData.trees[0].allocationSets.forEach((set, setIndex) =>
			set.forEach((allocation, allocationIndex) =>
				this.add(new AllocationUi(treeLayout.getCoordinatesRowColumn(setIndex, allocationIndex).container, allocation))));
	}
}

export default TechniquesUi;
