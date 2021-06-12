import {Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import UiButton from '../components/UiButton.js';
import UiSection from '../components/UiSection.js';
import HubUi from './HubUi.js';
import Ui from './Ui.js';

class EquipmentUi extends Ui {
	constructor() {
		super();
		let coordinate = HubUi.createSection('', false, .7).coordinate;

		// todo [high] use icon buttons
		// todo [high] use grid layout

		const COLUMNS = 16, ROWS = 8;
		let buttonSize = coordinate.width / COLUMNS;
		let verticalMargin = (coordinate.height - (ROWS * 2 + 1) * buttonSize) / 2;

		let equippedCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(buttonSize * 4, buttonSize);
		this.add(new UiSection(equippedCoordinate, 'Equipped'));
		this.fillButtons(equippedCoordinate, buttonSize);

		let salvageCoordinate = coordinate.clone
			.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
			.size(.07, buttonSize);
		this.add(new UiButton(salvageCoordinate, 'Salvage'));

		let forgeCoordinate = salvageCoordinate.clone
			.shift(-1, 0)
			.move(-Positions.MARGIN, 0)
			.size(buttonSize * 4, buttonSize);
		this.add(new UiSection(forgeCoordinate, 'Forge'));
		this.fillButtons(forgeCoordinate, buttonSize);

		let inventoryCoordinate = equippedCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin)
			.size(coordinate.width, 8 * buttonSize);
		this.add(new UiSection(inventoryCoordinate, 'Inventory'));
		this.fillButtons(inventoryCoordinate, buttonSize);

		let materialsCoordinate = inventoryCoordinate.clone
			.shift(0, 1)
			.move(0, verticalMargin);
		this.add(new UiSection(materialsCoordinate, 'Materials'));
		this.fillButtons(materialsCoordinate, buttonSize);
	}

	fillButtons(containerCoordinate, buttonSize) {
		let columns = Math.floor(containerCoordinate.width / buttonSize);
		let rows = Math.floor(containerCoordinate.height / buttonSize);
		let buttonCoordinate = containerCoordinate.clone
			.alignWithoutMove(Coordinate.Aligns.START)
			.size(containerCoordinate.width / columns, containerCoordinate.height / rows);
		for (let x = 0; x < columns; x++)
			for (let y = 0; y < rows; y++)
				this.add(new UiButton(buttonCoordinate.clone.shift(x, y), ''));
	}
}

export default EquipmentUi;
